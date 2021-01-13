import Router from "@koa/router";
import { isLoggedInDiscord, isCorsace } from "../../../../Server/middleware";
import { Category, CategoryGenerator } from "../../../../Models/MCA_AYIM/category";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { ModeDivision } from "../../../../Models/MCA_AYIM/modeDivision";
import { CategoryType } from "../../../../interfaces/category";

const adminYearsRouter = new Router;
const categoryGenerator = new CategoryGenerator;

adminYearsRouter.use(isLoggedInDiscord);
adminYearsRouter.use(isCorsace);

// Endpoints for creating a year
adminYearsRouter.post("/create", async (ctx) => {
    const data = ctx.request.body;

    if (!data.year) {
        return ctx.body = { error: "Missing year!" };
    } else if (!data.nominationStart) {
        return ctx.body = { error: "Missing nominationStart date!" };
    } else if (!data.nominationEnd) {
        return ctx.body = { error: "Missing nominationEnd date!" };
    } else if (!data.votingStart) {
        return ctx.body = { error: "Missing votingStart date!" };
    } else if (!data.votingEnd) {
        return ctx.body = { error: "Missing votingEnd date!" };
    } else if (!data.results) {
        return ctx.body = { error: "Missing results date!" };
    }

    try {
        let mca = await MCA.findOne(data.year);
        if (mca)
            return ctx.body = { error: "This year already exists!" };
        
        mca = new MCA;
        mca.year = data.year;
        mca.nomination = {
            start: data.nominationStart,
            end: data.nominationEnd,
        };
        mca.voting = {
            start: data.votingStart,
            end: data.votingEnd,
        };
        mca.results = data.results;

        await mca.save();

        // Create the grand awards
        const modes = await ModeDivision.find();
        for (const mode of modes) {
            const userGrand = categoryGenerator.createGrandAward(mca, mode, CategoryType.Users);
            const mapGrand = categoryGenerator.createGrandAward(mca, mode, CategoryType.Beatmapsets);

            await Promise.all([userGrand.save(), mapGrand.save()]);
        }

        ctx.body = { message: "Success! attached is the new MCA.", mca };
    } catch (e) {
        if (e)
            ctx.body = { error: e };
    }
});

// Endpoint for getting information for a year
adminYearsRouter.get("/:year", async (ctx) => {
    let year = ctx.params.year;
    if (!year || !/20\d\d/.test(year))
        return ctx.body = { error: "Invalid year given!" };
    
    year = parseInt(year);

    try {
        const categories = await Category.find({
            mca: {
                year,
            },
        });

        if (categories.length === 0)
            return ctx.body = { error: "No categories found for this year!" };

        ctx.body = { categories: categories.map(x => x.getInfo()) };
    } catch (e) {
        if (e)
            ctx.body = { error: e };  
    }
});

// Endpoint for deleting a year
adminYearsRouter.delete("/:year/delete", async (ctx) => {
    let year = ctx.params.year;
    if (!year || !/20\d\d/.test(year))
        return ctx.body = { error: "Invalid year given!" };
    
    year = parseInt(year);

    try {
        const mca = await MCA.findOne(year);
        if (!mca)
            return ctx.body = { error: "This year doesn't exist!" };

        const categories = await Category.find({
            mca: {
                year,
            },
        });
        for (const category of categories) {
            await category.remove();
        }

        const mcares = await mca.remove();
        
        ctx.body = { message: "Success! attached is the delete result.", mcares };
    } catch (e) {
        if (e)
            ctx.body = { error: e };  
    }
});

export default adminYearsRouter;
