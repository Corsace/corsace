import Router from "koa-router";
import { Beatmap } from "../../../CorsaceModels/beatmap";
import { User } from "../../../CorsaceModels/user";
import { isLoggedIn } from "../../../CorsaceServer/middleware";
import { isNotEligible } from "../middleware";
import { Config } from "../../../config";
import axios from "axios";
import { GuestRequest, RequestStatus } from "../../../CorsaceModels/MCA_AYIM/guestRequest";
import { ModeDivision } from "../../../CorsaceModels/MCA_AYIM/modeDivision";

const UserRouter = new Router();
const config = new Config();

UserRouter.get("/", isLoggedIn, async (ctx) => {
    ctx.body = { user: await ctx.state.user.getMCAInfo() };
});

UserRouter.post("/guestDifficulty/:year", isLoggedIn, isNotEligible, async (ctx) => {
    // Check if there's already a guest difficulty request sent
    const user = await User.findOneOrFail({ relations: ["guestRequest"], where: { id: ctx.state.user.id }});
    if (user.guestRequest) {
        ctx.body = { error: "A guest request already exists!" };
        return;
    }

    const data = ctx.request.body;
    // Check URL
    const linkRegex = /(osu|old)\.ppy\.sh\/(b|beatmaps|beatmapsets)\/(\d+)(#(osu|taiko|fruits|mania)\/(\d+))?/i;
    if (!linkRegex.test(data.url)) {
        ctx.body = { error: "Invalid URL!"};
        return;
    }
    const res = linkRegex.exec(data.url);
    let beatmapID = "0";

    if (res) {
        if (res[2] === "beatmapsets" && !res[6]) {
            ctx.body = { error: "/beatmapsets/ URL does not have a specific difficulty linked!"};
            return;
        } else if (res[2] === "beatmapsets") {
            beatmapID = res[6];
        } else {
            beatmapID = res[3];
        }
    }

    // Get beatmap information
    const beatmaps = (await axios.get(`https://osu.ppy.sh/api/get_beatmaps?k=${config.osuV1}&b=${beatmapID}`)).data;
    if (beatmaps.length !== 1) {
        ctx.body = { error: "Error in obtaining beatmap info!"};
        return;
    }
    const beatmap = beatmaps[0];

    // Check the year
    if (new Date(beatmap.approved_date).getUTCFullYear() !== parseInt(ctx.params.year)) {
        ctx.body = { error: "This map was not ranked in " + ctx.params.year + "!"};
        return;
    }

    // Find beatmap in DB
    const dbMap = await Beatmap.findOne(beatmap.beatmap_id);
    if (!dbMap) {
        ctx.body = { error: "Map is not in our database! If this map was ranked this year, please let VINXIS know." };
        return;
    }

    // Create guest requesst
    const guestReq = new GuestRequest;
    guestReq.mode = await ModeDivision.findOneOrFail(parseInt(beatmap.mode)+1);
    guestReq.accepted = RequestStatus.Pending;
    guestReq.beatmap = dbMap;
    guestReq.year = parseInt(ctx.params.year);
    await guestReq.save();

    user.guestRequest = guestReq;
    await user.save();
    ctx.body = { success: guestReq };
});

export default UserRouter;