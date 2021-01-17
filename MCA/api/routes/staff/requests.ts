import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { currentMCA } from "../../middleware";
import { GuestRequest } from "../../../../Models/MCA_AYIM/guestRequest";
import { MCA } from "../../../../Models/MCA_AYIM/mca";

const staffRequestsRouter = new Router;

staffRequestsRouter.use(isLoggedInDiscord);
staffRequestsRouter.use(isStaff);
staffRequestsRouter.use(currentMCA);

staffRequestsRouter.get("/", async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const requests = await GuestRequest.find({
        where: {
            mca,
        },
        relations: [
            "user",
            "mode",
            "mca",
            "beatmap",
            "beatmap.beatmapset",
        ],
    });

    ctx.body = requests;
});

staffRequestsRouter.post("/:id/update", async (ctx) => {
    const request = await GuestRequest.findOneOrFail(ctx.params.id);
    request.status = ctx.request.body.status;
    await request.save();

    ctx.body = {
        success: "Saved",
    };
});

export default staffRequestsRouter;
