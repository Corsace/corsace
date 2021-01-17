import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { Category } from "../../../../Models/MCA_AYIM/category";
import { currentMCA } from "../../middleware";

const staffRouter = new Router;

staffRouter.use(isLoggedInDiscord);
staffRouter.use(isStaff);
staffRouter.use(currentMCA);

// Endpoint to obtain all MCAs and their info
staffRouter.get("/", async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const mcaInfo = mca.getInfo();

    ctx.body = mcaInfo;
});

// Endpoint for getting information for a year
staffRouter.get("/categories", async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const categories = await Category.find({
        mca,
        requiresVetting: true,
    });

    if (categories.length === 0)
        return ctx.body = { error: "No categories found for this year that require vetting!" };

    ctx.body = categories.map(x => x.getInfo());
});

export default staffRouter;
