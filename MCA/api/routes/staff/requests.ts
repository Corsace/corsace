import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { currentMCA } from "../../../../MCA-AYIM/api/middleware";
import { GuestRequest } from "../../../../Models/MCA_AYIM/guestRequest";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { MCAEligibility } from "../../../../Models/MCA_AYIM/mcaEligibility";
import { RequestStatus } from "../../../../Interfaces/guestRequests";

const staffRequestsRouter = new Router;

staffRequestsRouter.use(isLoggedInDiscord);
staffRequestsRouter.use(isStaff);
staffRequestsRouter.use(currentMCA);

staffRequestsRouter.get("/", async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const requests = await GuestRequest
                            .createQueryBuilder("guestReq")
                            .innerJoin("guestReq.beatmap", "beatmap")
                            .innerJoin("guestReq.mca", "mca")
                            .innerJoin("guestReq.user", "user")
                            .innerJoin("guestReq.mode", "mode")
                            .select("guestReq.ID", "ID")
                            .addSelect("guestReq.status", "status")
                            .addSelect("user.osuUserid", "userID")
                            .addSelect("user.osuUsername", "username")
                            .addSelect("beatmap.ID", "beatmapID")
                            .addSelect("mode.name", "modeName")
                            .where(`mca.year = ${mca.year}`)
                            .orderBy("mode.ID", "ASC")
                            .addOrderBy("status", "ASC")
                            .getRawMany();

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
        eligibility.storyboard = true;
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
            if (!eligibility.standard && !eligibility.taiko && !eligibility.fruits && !eligibility.mania)
                eligibility.storyboard = false;
            await eligibility.save();
        }
    }

    await request.save();

    ctx.body = {
        success: "Saved",
    };
});

export default staffRequestsRouter;
