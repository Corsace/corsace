import * as compose from "koa-compose";
import { isLoggedInDiscord, isCorsace } from "../../../../Server/middleware";
import { Category, CategoryGenerator } from "../../../../Models/MCA_AYIM/category";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { ModeDivision } from "../../../../Models/MCA_AYIM/modeDivision";
import { CategoryFilter, CategoryInfo, CategoryType } from "../../../../Interfaces/category";
import { Nomination } from "../../../../Models/MCA_AYIM/nomination";
import { CorsaceContext, CorsaceRouter } from "../../../corsaceRouter";

const adminCategoriesRouter  = new CorsaceRouter();
const categoryGenerator = new CategoryGenerator();

adminCategoriesRouter.$use(isLoggedInDiscord);
adminCategoriesRouter.$use(isCorsace);

const validate: compose.Middleware<CorsaceContext<{ category: CategoryInfo }>> = async (ctx, next) => {
    const categoryInfo = ctx.request.body.category;
    const year: string = ctx.params.year;
    const modeString: string = ctx.request.body.mode;

    if (!categoryInfo.name)
        return ctx.body = {
            success: false,
            error: "Missing category name!",
        };
    else if (categoryInfo.type !== 0 && !categoryInfo.type)
        return ctx.body = {
            success: false,
            error: "Missing category type",
        };
    else if (!categoryInfo.maxNominations || categoryInfo.maxNominations <= 0)
        return ctx.body = {
            success: false,
            error: "Missing non-zero positive nomination count!",
        };
    else if (!year)
        return ctx.body = {
            success: false,
            error: "Missing year for category!",
        };
    else if (!modeString)
        return ctx.body = {
            success: false,
            error: "Missing mode for category!",
        };

    if (categoryInfo.type !== CategoryType.Users && categoryInfo.type !== CategoryType.Beatmapsets)
        return ctx.body = {
            success: false,
            error: "The category type provided does not exist!",
        };

    const mca = await MCA.findOne({ where: { year: parseInt(year, 10) }});
    if (!mca)
        return ctx.body = {
            success: false,
            error: "MCA for this year does not exist currently!",
        };

    const mode = await ModeDivision.findOne({ where: { name: modeString }});
    if (!mode)
        return ctx.body = {
            success: false,
            error: "The mode provided does not exist!",
        };

    ctx.state.mca = mca;
    ctx.state.mode = mode;

    await next();
};

// Endpoint for getting categories from a year
adminCategoriesRouter.$get<{ categories: CategoryInfo[] }>("/:year/categories", async (ctx) => {
    const yearString = ctx.params.year;
    if (!yearString || !/20\d\d/.test(yearString))
        return ctx.body = {
            success: false,
            error: "Invalid year given!",
        };
    
    const year = parseInt(yearString);

    const categories = await Category.find({
        where: {
            mca: {
                year,
            },
        },
        order: {
            mode: {
                ID: "ASC",
            },
            name: "ASC",
        },
    });

    ctx.body = {
        success: true,
        categories: categories.map(x => x.getInfo()),
    };
});

// Endpoint for creating a category
adminCategoriesRouter.$post<{ category: CategoryInfo }>("/:year/categories", validate, async (ctx) => {
    const categoryInfo = ctx.request.body.category;
    const filter: CategoryFilter = ctx.request.body.filter;

    const category = categoryGenerator.createOrUpdate({
        ...categoryInfo,
        mca: ctx.state.mca,
        mode: ctx.state.mode,
    }, filter);
    await category.save();

    ctx.body = {
        success: true,
        category: category.getInfo(),
    };
});

// Endpoint for updating a category
adminCategoriesRouter.$put<{ category: CategoryInfo }>("/:year/categories/:id", validate, async (ctx) => {
    const categoryInfo = ctx.request.body.category;
    const filter: CategoryFilter = ctx.request.body.filter;

    const ID = parseInt(ctx.params.id, 10);
    let category = await Category.findOneOrFail({ where: { ID }});
    category = categoryGenerator.createOrUpdate({
        ...categoryInfo,
        mca: ctx.state.mca,
        mode: ctx.state.mode,
    }, filter, category);
    await category.save();

    ctx.body = {
        success: true,
        category: category.getInfo(),
    };
});

// Endpoint for deleting a category
adminCategoriesRouter.$delete<{ category: CategoryInfo }>("/:year/categories/:id", async (ctx) => {
    const categoryIDString = ctx.params.id;
    if (!categoryIDString || !/\d+/.test(categoryIDString))
        return ctx.body = { 
            success: false,
            error: "Invalid category ID given!",
        };

    const categoryID = parseInt(categoryIDString);

    const category = await Category.findOne({ where: { ID: categoryID }});
    if (!category)
        return ctx.body = { 
            success: false,
            error: "No category with this ID exists!",
        };

    await Promise.all((await Nomination.find({
        where: {
            category: {
                ID: categoryID,
            },
        },
    })).map(nom => nom.remove()));
    const categoryRes = await category.remove(); 
    ctx.body = { 
        success: true,
        category: categoryRes.getInfo(),
    };
});

export default adminCategoriesRouter;
