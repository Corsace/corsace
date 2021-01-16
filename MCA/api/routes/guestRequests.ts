import Router from "@koa/router";
import { Beatmap } from "../../../Models/beatmap";
import { User } from "../../../Models/user";
import { isLoggedIn } from "../../../Server/middleware";
import { isEligibleFor, currentMCA } from "../middleware";
import { Config } from "../../../config";
import axios from "axios";
import { GuestRequest } from "../../../Models/MCA_AYIM/guestRequest";
import { ModeDivision, ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";
import { RequestStatus } from "../../../Interfaces/guestRequests";
import { MCA } from "../../../Models/MCA_AYIM/mca";

const guestRequestRouter = new Router();
const config = new Config();

interface BodyData {
    mode: string;
    url: string;
}

async function validateBody (user: User, year: number, data: BodyData, currentRequestId?: number): Promise<{ error: string } | { beatmap: Beatmap; mode: ModeDivision; }> {
    // Validate mode
    const modeId = ModeDivisionType[data.mode];
    const mode = await ModeDivision.findOneOrFail(modeId);
    
    if (isEligibleFor(user, mode.ID, year)) {
        return {
            error: `User is already eligible for ${mode.name} (${year})`,
        };
    }

    // Check if there's already a guest difficulty request sent
    if (user.guestRequests.some(r => r.mca.year === year && r.mode.ID === mode.ID && r.ID !== currentRequestId)) {
        return {
            error: "A guest request already exists!",
        };
    }

    // Check URL
    const linkRegex = /(osu|old)\.ppy\.sh\/(b|beatmaps|beatmapsets)\/(\d+)(#(osu|taiko|fruits|mania)\/(\d+))?/i;
    if (!linkRegex.test(data.url)) {
        return { error: "Invalid URL!"};
    }
    const res = linkRegex.exec(data.url);
    let beatmapID = "0";

    if (res) {
        if (res[2] === "beatmapsets" && !res[6]) {
            return { error: "/beatmapsets/ URL does not have a specific difficulty linked!"};
        } else if (res[2] === "beatmapsets") {
            beatmapID = res[6];
        } else {
            beatmapID = res[3];
        }
    }

    // Get beatmap information
    const beatmaps = (await axios.get(`https://osu.ppy.sh/api/get_beatmaps?k=${config.osuV1}&b=${beatmapID}`)).data;
    if (beatmaps.length !== 1) {
        return { error: "Error in obtaining beatmap info!"};
    }
    const beatmap = beatmaps[0];

    // Check the year
    if (new Date(beatmap.approved_date).getUTCFullYear() !== year) {
        return { error: "This map was not ranked in " + year + "!"};
    }

    // Find beatmap in DB
    const dbMap = await Beatmap.findOne(beatmap.beatmap_id);
    if (!dbMap) {
        return { error: "Map is not in our database! If this map was ranked this year, please let VINXIS know." };
    }

    return { 
        beatmap: dbMap,
        mode,
    };
}

guestRequestRouter.use(isLoggedIn);
guestRequestRouter.use(currentMCA);

guestRequestRouter.post("/create", async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const user: User = ctx.state.user;
    const res = await validateBody(user, mca.year, ctx.request.body);

    if ("error" in res) {
        return ctx.body = res;
    }

    // Create guest requesst
    const guestReq = new GuestRequest;
    guestReq.user = user;
    guestReq.mca = mca;
    guestReq.mode = res.mode;
    guestReq.beatmap = res.beatmap;
    guestReq.status = RequestStatus.Pending;
    await guestReq.save();

    ctx.body = guestReq;
});

guestRequestRouter.post("/:id/update", async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const id: number = parseInt(ctx.params.id);
    const user: User = ctx.state.user;
    const request = user.guestRequests.find(r => r.ID === id && r.mca.year === mca.year);

    if (!request || request.status === RequestStatus.Accepted) {
        return ctx.body = {
            error: "Not valid request",
        };
    }
    
    const res = await validateBody(user, mca.year, ctx.request.body, id);

    if ("error" in res) {
        return ctx.body = res;
    }

    request.mode = res.mode;
    request.beatmap = res.beatmap;
    request.status = RequestStatus.Pending;
    await request.save();

    ctx.body = request;
});

export default guestRequestRouter;
