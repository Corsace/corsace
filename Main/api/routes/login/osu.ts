import Router from "@koa/router";
import passport from "koa-passport";
import Axios from "axios";
import { ParameterizedContext } from "koa";
import { MCAEligibility } from "../../../../Models/MCA_AYIM/mcaEligibility";
import { config } from "node-config-ts";
import { UsernameChange } from "../../../../Models/usernameChange";

// If you are looking for osu! passport info then go to Server > passportFunctions.ts

const osuRouter = new Router();
const modes = [
    "standard",
    "taiko",
    "fruits",
    "mania",
];

osuRouter.get("/", async (ctx: ParameterizedContext<any>, next) => {
    ctx.cookies.set("redirect", ctx.query.redirect ?? "back", { overwrite: true });
    await next();
}, passport.authenticate("oauth2", { scope: ["identify", "public"] }));
osuRouter.get("/callback", async (ctx: ParameterizedContext<any>, next) => {
    return await passport.authenticate("oauth2", { scope: ["identify", "public"], failureRedirect: "/" }, async (err, user) => {
        if (user) {
            await user.save();
            ctx.login(user);
            await next();
        } else {
            ctx.status = 400;
            ctx.body = { error: err };
        }
    })(ctx, next);
}, async (ctx, next) => {
    try {
        // Username changes
        const res = await Axios.get("https://osu.ppy.sh/api/v2/me", {
            headers: {
                Authorization: `Bearer ${ctx.state.user.osu.accessToken}`,
            },
        });
        const usernames: string[] = res.data.previous_usernames;
        for (const name of usernames) {
            let nameChange = await UsernameChange.findOne({ name, user: ctx.state.user });
            if (!nameChange) {
                nameChange = new UsernameChange;
                nameChange.name = name;
                nameChange.user = ctx.state.user;
                await nameChange.save();
            }
        }

        // Check if current username is a previous username or not
        const currentName = await UsernameChange.findOne({
            name: ctx.state.user.osu.username,
            user: ctx.state.user,
        });
        if (currentName)
            await currentName.remove();

        await next();
    } catch (e) {
        if (e) {
            ctx.state = 500;
            ctx.body = { error: e };
        }
    }
}, async ctx => {
    try {
        // MCA data
        const beatmaps = (await Axios.get(`https://osu.ppy.sh/api/get_beatmaps?k=${config.osu.v1.apiKey}&u=${ctx.state.user.osu.userID}`)).data;
        if (beatmaps.length != 0) {
            for (const beatmap of beatmaps) {
                if (!beatmap.version.includes("'") && (beatmap.approved == 2 || beatmap.approved == 1)) {
                    const date = new Date(beatmap.approved_date);
                    const year = date.getUTCFullYear();
                    let eligibility = await MCAEligibility.findOne({ relations: ["user"], where: { year: year, user: ctx.state.user }});
                    if (!eligibility) {
                        eligibility = new MCAEligibility();
                        eligibility.year = year;
                        eligibility.user = ctx.state.user;
                    }
                    
                    if (!eligibility[modes[beatmap.mode]]) {
                        eligibility[modes[beatmap.mode]] = true;
                        eligibility.storyboard = true;
                        await eligibility.save();
                        const i = ctx.state.user.mcaEligibility.findIndex((e: MCAEligibility) => e.year === year);
                        if (i === -1)
                            ctx.state.user.mcaEligibility.push(eligibility);
                        else
                            ctx.state.user.mcaEligibility[i] = eligibility;
                    }
                }
            }
        }
        const redirect = ctx.cookies.get("redirect");
        ctx.cookies.set("redirect", "");
        ctx.redirect(redirect ?? "back");
    } catch (e) {
        if (e) {
            ctx.state = 500;
            ctx.body = { error: e };
        }
    }
});

export default osuRouter;