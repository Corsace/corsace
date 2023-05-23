import Router, { Middleware } from "@koa/router";
import { isLoggedInDiscord, isCorsace } from "../../../../Server/middleware";
import { Category, CategoryGenerator } from "../../../../Models/MCA_AYIM/category";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { ModeDivision } from "../../../../Models/MCA_AYIM/modeDivision";
import { CategoryType } from "../../../../Interfaces/category";
import { Nomination } from "../../../../Models/MCA_AYIM/nomination";
import { Vote } from "../../../../Models/MCA_AYIM/vote";
import { cache } from "../../../../Server/cache";

const adminYearsRouter = new Router;
const categoryGenerator = new CategoryGenerator;

adminYearsRouter.use(isLoggedInDiscord);
adminYearsRouter.use(isCorsace);

const validate: Middleware = async (ctx, next) => {
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

    await next();
};

// Endpoints for creating a year
adminYearsRouter.post("/", validate, async (ctx) => {
    const data = ctx.request.body;

    let mca = await MCA.findOne(data.year);
    if (mca)
        return ctx.body = { error: "This year already exists!" };
        
    mca = await MCA.fillAndSave(data);

    // Create the grand awards
    const modes = await ModeDivision.find();
    for (const mode of modes) {
        const userGrand = categoryGenerator.createGrandAward(mca, mode, CategoryType.Users, mode.name === "storyboard");
        const mapGrand = categoryGenerator.createGrandAward(mca, mode, CategoryType.Beatmapsets, mode.name === "storyboard");

        await Promise.all([
            userGrand.save(),
            mapGrand.save()
        ]);
    }

    cache.del("/api/mcaInfo/front?year=" + data.year);
    cache.del("/api/mca?year=" + data.year);
    cache.del("/api/staff");

    ctx.body = { 
        message: "Success! attached is the new MCA.", 
        mca,
    };
});

// Endpoints for updating a year
adminYearsRouter.put("/:year", validate, async (ctx) => {
    const data = ctx.request.body;

    let mca = await MCA.findOneOrFail(data.year);    
    mca = await MCA.fillAndSave(data, mca);

    cache.del("/api/mcaInfo/front?year=" + data.year);
    cache.del("/api/mca?year=" + data.year);
    cache.del("/api/staff");

    ctx.body = { 
        message: "updated",
        mca,
    };
});

// Endpoint for deleting a year
adminYearsRouter.delete("/:year/delete", async (ctx) => {
    const yearStr = ctx.params.year;
    if (!yearStr || !/20\d\d/.test(yearStr))
        return ctx.body = { error: "Invalid year given!" };
    
    const year = parseInt(yearStr);

    try {
        const mca = await MCA.findOne({
            where: { year },
        });
        if (!mca)
            return ctx.body = { error: "This year doesn't exist!" };

        const categories = await Category.find({
            where: {
                mca: {
                    year,
                },
            },
        });
        for (const category of categories) {
            const [nominations, votes] = await Promise.all([
                Nomination.find({
                    where: {
                        category: {
                            ID: category.ID,
                        },
                    },
                }),
                Vote.find({
                    where: {
                        category: {
                            ID: category.ID,
                        },
                    },
                }),
            ]);
            for (const nom of nominations) {
                await nom.remove();
            }
            for (const vote of votes) {
                await vote.remove();
            }
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
