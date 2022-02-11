import Router, { Middleware } from "@koa/router";
import { isLoggedInDiscord, isCorsace } from "../../../../Server/middleware";
import { Category, CategoryGenerator } from "../../../../Models/MCA_AYIM/category";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { ModeDivision } from "../../../../Models/MCA_AYIM/modeDivision";
import { CategoryFilter, CategoryType } from "../../../../Interfaces/category";
import { Nomination } from "../../../../Models/MCA_AYIM/nomination";

const adminCategoriesRouter = new Router;
const categoryGenerator = new CategoryGenerator;

adminCategoriesRouter.use(isLoggedInDiscord);
adminCategoriesRouter.use(isCorsace);

const validate: Middleware = async (ctx, next) => {
    const categoryInfo = ctx.request.body.category;
    const year: string = ctx.params.year;
    const modeString: string = ctx.request.body.mode;

    if (!categoryInfo.name)
        return ctx.body = { error: "Missing category name!" };
    else if (categoryInfo.type !== 0 && !categoryInfo.type)
        return ctx.body = { error: "Missing category type!" };
    else if (!categoryInfo.maxNominations || categoryInfo.maxNominations <= 0)
        return ctx.body = { error: "Missing non-zero positive nomination count!" };
    else if (!year)
        return ctx.body = { error: "Missing year for category!" };
    else if (!modeString)
        return ctx.body = { error: "Missing mode for category!" };

    if (categoryInfo.type !== CategoryType.Users && categoryInfo.type !== CategoryType.Beatmapsets)
        return ctx.body = { error: "The category type provided does not exist!"};

    const mca = await MCA.findOne({ year: parseInt(year, 10) });
    if (!mca)
        return ctx.body = { error: "MCA for this year does not exist currently!" };

    const mode = await ModeDivision.findOne({ name: modeString });
    if (!mode)
        return ctx.body = { error: "The mode provided does not exist!" };

    ctx.state.mca = mca;
    ctx.state.mode = mode;

    await next();
};

// Endpoint for getting categories from a year
adminCategoriesRouter.get("/:year/categories", async (ctx) => {
    const yearString = ctx.params.year;
    if (!yearString || !/20\d\d/.test(yearString))
        return ctx.body = { error: "Invalid year given!" };
    
    const year = parseInt(yearString);

    const categories = await Category.find({
        where: {
            mca: {
                year,
            },
        },
        order: {
            mode: "ASC",
            name: "ASC",
        },
    });

    ctx.body = { 
        categories: categories.map(x => x.getInfo()),
    };
});

// Endpoint for creating a category
adminCategoriesRouter.post("/:year/categories", validate, async (ctx) => {
    const categoryInfo = ctx.request.body.category;
    const filter: CategoryFilter = ctx.request.body.filter;

    const category = categoryGenerator.createOrUpdate({
        ...categoryInfo,
        mca: ctx.state.mca,
        mode: ctx.state.mode,
    }, filter);
    await category.save();

    ctx.body = {
        message: "Success! attached is the new category.",
        category,
    };
});

// Endpoint for updating a category
adminCategoriesRouter.put("/:year/categories/:id", validate, async (ctx) => {
    const categoryInfo = ctx.request.body.category;
    const filter: CategoryFilter = ctx.request.body.filter;

    const ID = parseInt(ctx.params.id, 10);
    let category = await Category.findOneOrFail({ ID });
    category = categoryGenerator.createOrUpdate({
        ...categoryInfo,
        mca: ctx.state.mca,
        mode: ctx.state.mode,
    }, filter, category);
    await category.save();

    ctx.body = {
        message: "Updated",
        category,
    };
});

// Endpoint for deleting a category
adminCategoriesRouter.delete("/:year/categories/:id", async (ctx) => {
    const categoryIDString = ctx.params.id;
    if (!categoryIDString || !/\d+/.test(categoryIDString))
        return ctx.body = { error: "Invalid category ID given!" };

    const categoryID = parseInt(categoryIDString);

    const category = await Category.findOne(categoryID);
    if (!category)
        return ctx.body = { error: "No category with this ID exists!" };

    await Promise.all((await Nomination.find({
        category,
    })).map(nom => nom.remove()));
    const categoryRes = await category.remove(); 
    ctx.body = { message: "Success! attached is the delete result.", categoryRes };
});

export default adminCategoriesRouter;
