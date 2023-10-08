import { CorsaceRouter } from "../../../corsaceRouter";
import { isLoggedInDiscord } from "../../../../Server/middleware";
import { isMCAStaff, validatePhaseYear } from "../../../../Server/middleware/mca-ayim";
import { GuestRequest } from "../../../../Models/MCA_AYIM/guestRequest";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { MCAEligibility } from "../../../../Models/MCA_AYIM/mcaEligibility";
import { RequestStatus, StaffGuestRequest } from "../../../../Interfaces/guestRequests";
import { MCAAuthenticatedState, UserAuthenticatedState } from "koa";
import { ModeDivisionType } from "../../../../Interfaces/modes";

const staffRequestsRouter  = new CorsaceRouter<UserAuthenticatedState>();

staffRequestsRouter.$use(isLoggedInDiscord);
staffRequestsRouter.$use(isMCAStaff);

staffRequestsRouter.$get<MCAAuthenticatedState>("/:year", validatePhaseYear, async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const requests: StaffGuestRequest[] = await GuestRequest
        .createQueryBuilder("guestReq")
        .innerJoin("guestReq.beatmap", "beatmap")
        .innerJoin("guestReq.mca", "mca")
        .innerJoin("guestReq.user", "user")
        .innerJoin("guestReq.mode", "mode")
        .innerJoin("beatmap.beatmapset", "beatmapset")
        .select("guestReq.ID", "ID")
        .addSelect("guestReq.status", "status")
        .addSelect("user.osuUserid", "userID")
        .addSelect("user.osuUsername", "username")
        .addSelect("beatmap.ID", "beatmapID")
        .addSelect("beatmapset.artist", "artist")
        .addSelect("beatmapset.title", "title")
        .addSelect("beatmap.difficulty", "difficulty")
        .addSelect("mode.name", "modeName")
        .where(`mca.year = ${mca.year}`)
        .orderBy("mode.ID", "ASC")
        .addOrderBy("status", "ASC")
        .getRawMany();

    ctx.body = {
        success: true,
        requests,
    };
});

staffRequestsRouter.$post("/:id/update", async (ctx) => {
    const request = await GuestRequest.findOneOrFail({
        where: {
            ID: parseInt(ctx.params.id, 10),
        },
        relations: ["user", "mca"],
    });
    request.status = ctx.request.body.status;

    if (request.status === RequestStatus.Accepted) {
        let eligibility = await MCAEligibility.findOne({
            where: {
                year: request.mca.year,
                user: {
                    ID: request.user.ID,
                },
            },
            relations: ["user"],
        });

        if (!eligibility) {
            eligibility = new MCAEligibility();
            eligibility.user = request.user;
            eligibility.year = request.mca.year;
        }

        eligibility[request.mode.name as keyof typeof ModeDivisionType] = true;
        eligibility.storyboard = true;
        await eligibility.save();
    } else if (request.status === RequestStatus.Rejected) {
        const eligibility = await MCAEligibility.findOne({
            where: {
                year: request.mca.year,
                user: {
                    ID: request.user.ID,
                },
            },
            relations: ["user"],
        });

        if (eligibility) {
            eligibility[request.mode.name as keyof typeof ModeDivisionType] = false;
            if (!eligibility.standard && !eligibility.taiko && !eligibility.fruits && !eligibility.mania)
                eligibility.storyboard = false;
            await eligibility.save();
        }
    }

    await request.save();

    ctx.body = {
        success: true,
    };
});

export default staffRequestsRouter;
