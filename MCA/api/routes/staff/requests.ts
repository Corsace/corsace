import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { currentMCA } from "../../../../MCA-AYIM/api/middleware";
import { GuestRequest } from "../../../../Models/MCA_AYIM/guestRequest";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { MCAEligibility } from "../../../../Models/MCA_AYIM/mcaEligibility";
import { RequestStatus } from "../../../../Interfaces/requests";

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
        order: {
            "mode": "ASC",
            "status": "ASC",
        },
    });

    ctx.body = requests;
});

staffRequestsRouter.post("/:id/update", async (ctx) => {
    const request = await GuestRequest.findOneOrFail({
        where: {
            ID: ctx.params.id,
        },
        relations: ["user", "mca"],
    });
    request.status = ctx.request.body.status;

    if (request.status === RequestStatus.Accepted) {
        let eligibility = await MCAEligibility.findOne({
            where: {
                year: request.mca.year,
                user: request.user,
            },
            relations: ["user"],
        });

        if (!eligibility) {
            eligibility = new MCAEligibility();
            eligibility.user = request.user;
            eligibility.year = request.mca.year;
        }

        eligibility[request.mode.name] = true;
        await eligibility.save();
    } else if (request.status === RequestStatus.Rejected) {
        let eligibility = await MCAEligibility.findOne({
            where: {
                year: request.mca.year,
                user: request.user,
            },
            relations: ["user"],
        });

        if (eligibility) {
            eligibility[request.mode.name] = false;
            await eligibility.save();
        }
    }

    await request.save();

    ctx.body = {
        success: "Saved",
    };
});

export default staffRequestsRouter;
