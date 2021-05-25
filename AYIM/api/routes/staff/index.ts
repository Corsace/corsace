import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { Category } from "../../../../Models/MCA_AYIM/category";
import { currentMCA } from "../../../../MCA-AYIM/api/middleware";

const staffRouter = new Router;

staffRouter.use(isLoggedInDiscord);
staffRouter.use(isStaff);
staffRouter.use(currentMCA);

// Endpoint to obtain current MCA and its info
staffRouter.get("/", async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const mcaInfo = mca.getInfo();

    ctx.body = mcaInfo;
});

export default staffRouter;
