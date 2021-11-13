import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { Category } from "../../../../Models/MCA_AYIM/category";
import { validatePhaseYear } from "../../../../MCA-AYIM/api/middleware";

const staffRouter = new Router;

staffRouter.use(isLoggedInDiscord);
staffRouter.use(isStaff);

// Endpoint to obtain current MCA and its info
staffRouter.get("/:year", validatePhaseYear, async (ctx) => {
    if (await ctx.cashed())
        return;

    ctx.body = ctx.state.mca.getInfo();
});

// Endpoint for getting information for a year
staffRouter.get("/categories/:year", validatePhaseYear, async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const categories = await Category.find({
        mca,
    });

    if (categories.length === 0)
        return ctx.body = { error: "No categories found for this year!" };

    ctx.body = categories.map(x => x.getInfo());
});

export default staffRouter;
