import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { validatePhaseYear } from "../../middleware";
import { GuestRequest } from "../../../../Models/MCA_AYIM/guestRequest";

const staffRequestsRouter = new Router;

staffRequestsRouter.use(isLoggedInDiscord);
staffRequestsRouter.use(isStaff);
staffRequestsRouter.use(validatePhaseYear);

staffRequestsRouter.get("/:year", async (ctx) => {
    const year = ctx.state.year;
    const requests = await GuestRequest.find({
        where: {
            mca: {
                year,
            },
        },
        relations: ["user", "beatmap", "mode", "mca"],
    });

    ctx.body = requests;
});

staffRequestsRouter.get("/:year/:id/update", async (ctx) => {
    const request = await GuestRequest.findOneOrFail(ctx.params.id);
    request.status = ctx.request.body.status;
    await request.save();

    ctx.body = {
        success: "Saved",
    };
});

export default staffRequestsRouter;
