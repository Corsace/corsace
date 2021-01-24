import Router from "@koa/router";
import { isLoggedInDiscord, isHeadStaff } from "../../../../Server/middleware";
import { MCA } from "../../../../Models/MCA_AYIM/mca";

const adminRouter = new Router;

adminRouter.use(isLoggedInDiscord);
adminRouter.use(isHeadStaff);

// Endpoint to obtain all MCAs and their info
adminRouter.get("/", async (ctx) => {
    const mca = await MCA.find();
    const mcaInfo = mca.map(x => x.getInfo());

    ctx.body = { mca: mcaInfo };
});

export default adminRouter;
