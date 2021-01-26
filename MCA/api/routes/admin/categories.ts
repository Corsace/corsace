import Router from "@koa/router";
import { isLoggedInDiscord, isCorsace } from "../../../../Server/middleware";
import { Category, CategoryGenerator } from "../../../../Models/MCA_AYIM/category";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { ModeDivision } from "../../../../Models/MCA_AYIM/modeDivision";
import { CategoryInfo, CategoryType } from "../../../../Interfaces/category";

const adminCategoriesRouter = new Router;
const categoryGenerator = new CategoryGenerator;

adminCategoriesRouter.use(isLoggedInDiscord);
adminCategoriesRouter.use(isCorsace);

// Endpoint for creating a category
adminCategoriesRouter.post("/create", async (ctx) => {
    const categoryInfo: CategoryInfo = ctx.request.body.categoryInfo;
    const year: number = ctx.request.body.year;
    const modeString: string = ctx.request.body.mode;

    if (!categoryInfo.name)
        return ctx.body = { error: "Missing category name!" };
    else if (!categoryInfo.type)
        return ctx.body = { error: "Missing category type!" };
    else if (!categoryInfo.maxNominations || categoryInfo.maxNominations <= 0)
        return ctx.body = { error: "Missing non-zero positive nomination count!" };
    else if (!year)
        return ctx.body = { error: "Missing year for category!" };
    else if (!modeString)
        return ctx.body = { error: "Missing mode for category!" };

    if (categoryInfo.type !== "users" && categoryInfo.type !== "beatmapsets")
        return ctx.body = { error: "The category type provided does not exist!"};

    const mca = await MCA.findOne({ year: year });
    if (!mca)
        return ctx.body = { error: "MCA for this year does not exist currently!" };

    const mode = await ModeDivision.findOne({ name: modeString });
    if (!mode)
        return ctx.body = { error: "The mode provided does not exist!" };

    const category = categoryGenerator.create(categoryInfo.name, CategoryType[categoryInfo.type], mca, mode);
        
    if (categoryInfo.type === "beatmapsets" && categoryInfo.filter)
        category.addFilter(categoryInfo.filter);
    else if (categoryInfo.type === "users" && categoryInfo.filter?.rookie)
        category.addFilter({ rookie: true });

    if (categoryInfo.maxNominations !== 3)
        category.maxNominations = categoryInfo.maxNominations;

    if (categoryInfo.isRequired)
        category.isRequired = categoryInfo.isRequired;
        
    if (categoryInfo.requiresVetting)
        category.requiresVetting = categoryInfo.requiresVetting;
        
    await category.save();

    ctx.body = { 
        message: "Success! attached is the new category.",
        category,
    };
});

// Endpoint for getting information for a category
adminCategoriesRouter.get("/:id", async (ctx) => {
    let categoryID = ctx.params.id;
    if (!categoryID || !/\d+/.test(categoryID))
        return ctx.body = { error: "Invalid category ID given!" };

    categoryID = parseInt(categoryID);

    const category = await Category.findOne(categoryID);

    if (!category)
        return ctx.body = { error: "No category found for the given ID!" };

    console.log(category);

    ctx.body = { error: "Gj" };
});

// Endpoint for deleting a category
adminCategoriesRouter.delete("/:id/delete", async (ctx) => {
    let categoryID = ctx.params.id;
    if (!categoryID || !/\d+/.test(categoryID))
        return ctx.body = { error: "Invalid category ID given!" };

    categoryID = parseInt(categoryID);

    try {
        const category = await Category.findOne(categoryID);
        if (!category)
            return ctx.body = { error: "No category with this ID exists!" };

        const categoryRes = await category.remove(); 
        ctx.body = { message: "Success! attached is the delete result.", categoryRes };
    } catch (e) {
        if (e)
            ctx.body = { error: e };  
    }
});

export default adminCategoriesRouter;
