import { CorsaceRouter } from "../../corsaceRouter";
import { Beatmap } from "../../../Models/beatmap";
import { User } from "../../../Models/user";
import { isLoggedIn } from "../../../Server/middleware";
import { isEligibleFor, currentMCA } from "../../../Server/middleware/mca-ayim";
import { config } from "node-config-ts";
import axios from "axios";
import { GuestRequest } from "../../../Models/MCA_AYIM/guestRequest";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { RequestStatus } from "../../../Interfaces/guestRequests";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { MCAAuthenticatedState } from "koa";
import { ModeDivisionType } from "../../../Interfaces/modes";

interface BodyData {
    mode: string;
    url: string;
}

async function validateBody (user: User, year: number, data: BodyData, currentRequestId?: number): Promise<{ error: string } | { beatmap: Beatmap; mode: ModeDivision; }> {
    // Validate mode
    if (!(data.mode in ModeDivisionType)) {
        return { 
            error: "Invalid mode, please use standard, taiko, fruits or mania",
        };
    }
    const modeId = ModeDivisionType[data.mode as keyof typeof ModeDivisionType];
    const mode = await ModeDivision.findOneOrFail({ where: { ID: modeId }});
    
    if (isEligibleFor(user, mode.ID, year)) {
        return {
            error: `User is already eligible for ${mode.name} (${year})`,
        };
    }

    // Check if there's already a guest difficulty request sent
    if (user.guestRequests.some(r => r.mca.year === year && r.mode.ID === mode.ID && (!currentRequestId || r.ID !== currentRequestId))) {
        return {
            error: "A guest request for this year + mode already exists!",
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
    const { data: beatmaps } = await axios.get<any[]>(`${config.osu.proxyBaseUrl ?? "https://osu.ppy.sh"}/api/get_beatmaps?k=${config.osu.v1.apiKey}&b=${beatmapID}`);
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

    // Check mode consistency
    if (dbMap.mode.ID !== mode.ID && mode.name !== "storyboard") {
        return { error: "Map is not the correct mode! This beatmap's mode is " + dbMap.mode.name + " while the mode you are applying to is for " + mode.name};
    }

    return { 
        beatmap: dbMap,
        mode,
    };
}

const guestRequestRouter  = new CorsaceRouter<MCAAuthenticatedState>();

guestRequestRouter.$use(isLoggedIn);
guestRequestRouter.$use(currentMCA);

guestRequestRouter.$post("/create", async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const user: User = ctx.state.user;
    const res = await validateBody(user, mca.year, ctx.request.body);

    if ("error" in res) {
        return ctx.body = {
            success: false,
            error: res.error,
        };
    }

    // Create guest requesst
    const guestReq = new GuestRequest();
    guestReq.user = user;
    guestReq.mca = mca;
    guestReq.mode = res.mode;
    guestReq.beatmap = res.beatmap;
    guestReq.status = RequestStatus.Pending;
    await guestReq.save();

    ctx.body = {
        success: true,
        guestReq,
    };
});

guestRequestRouter.$post("/:id/update", async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const id: number = parseInt(ctx.params.id);
    const user: User = ctx.state.user;
    const request = user.guestRequests.find(r => r.ID === id && r.mca.year === mca.year);

    if (!request || request.status === RequestStatus.Accepted) {
        return ctx.body = {
            success: false,
            error: "Not valid request",
        };
    }
    
    const res = await validateBody(user, mca.year, ctx.request.body, id);

    if ("error" in res) {
        return ctx.body = {
            success: false,
            error: res.error,
        };
    }

    request.mode = res.mode;
    request.beatmap = res.beatmap;
    request.status = RequestStatus.Pending;
    await request.save();

    ctx.body = {
        success: true,
        request,
    };
});

export default guestRequestRouter;
