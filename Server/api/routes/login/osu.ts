import Router from "@koa/router";
import passport from "koa-passport";
import Axios from "axios";
import { ParameterizedContext } from "koa";
import { MCAEligibility } from "../../../../Models/MCA_AYIM/mcaEligibility";
import { config } from "node-config-ts";
import { UsernameChange } from "../../../../Models/usernameChange";
import { redirectToMainDomain } from "./middleware";
import { osuV2Client } from "../../../osu";
import { isPossessive } from "../../../../Models/MCA_AYIM/guestRequest";

// If you are looking for osu! passport info then go to Server > passportFunctions.ts

const osuRouter = new Router();
const modes = [
    "standard",
    "taiko",
    "fruits",
    "mania",
];

osuRouter.get("/", redirectToMainDomain, async (ctx: ParameterizedContext<any>, next) => {
    const site = Array.isArray(ctx.query.site) ? ctx.query.site[0] : ctx.query.site;
    if (!site)
        throw new Error("No site specified");

    const baseURL = ctx.query.site ? (config[site] ? config[site].publicUrl : config.corsace.publicUrl) : "";
    const params = ctx.query.redirect ?? "";
    const redirectURL = baseURL + params ?? "back";
    ctx.cookies.set("redirect", redirectURL, { overwrite: true });
    await next();
}, passport.authenticate("oauth2", { scope: ["identify", "public", "friends.read"] }));

osuRouter.get("/callback", async (ctx: ParameterizedContext<any>, next) => {
    return await passport.authenticate("oauth2", { scope: ["identify", "public", "friends.read"], failureRedirect: "/" }, async (err, user) => {
        if (user) {
            await user.save();
            ctx.login(user);
            await next();
        } else {
            const redirect = ctx.cookies.get("redirect");
            ctx.cookies.set("redirect", "");
            ctx.redirect(redirect ?? "back");
            return;
        }
    })(ctx, next);
}, async (ctx, next) => {
    try {
        // api v2 data
        const data = await osuV2Client.getUserInfo(ctx.state.user.osu.accessToken);

        // Username changes
        const usernames: string[] = data.previous_usernames;
        for (const name of usernames) {
            let nameChange = await UsernameChange.findOne({ 
                where: { 
                    name, 
                    user: {
                        ID: ctx.state.user.ID,
                    },
                },
            });
            if (!nameChange) {
                nameChange = new UsernameChange;
                nameChange.name = name;
                nameChange.user = ctx.state.user;
                await nameChange.save();
            }
        }

        // Check if current username is a previous username or not
        const currentName = await UsernameChange.findOne({
            where: {
                name: ctx.state.user.osu.username,
                user: {
                    ID: ctx.state.user.ID,
                },
            },
        });
        if (currentName)
            await currentName.remove();

        // Check if BN/NAT/DEV/SPT/PPY
        if (data.groups.some(group => [11, 22, 33, 28, 32, 7, 31].some(num => group.id === num))) {
            let eligibleModes: string[] = [];
            if (data.groups.some(group => [11, 22, 33].some(num => group.id === num))) // DEV, SPT, PPY groups
                eligibleModes = ["standard", "taiko", "fruits", "mania"];
            else {
                for (const group of data.groups) { // BN, NAT groups
                    if (![28, 32, 7, 31].some(num => group.id === num))
                        continue;
                    if (group.id === 31 && group.playmodes.length === 0) {
                        eligibleModes.push(data.playmode);
                    } else 
                        eligibleModes.push(...group.playmodes);
                }
                eligibleModes = eligibleModes.map(mode => mode === "osu" ? "standard" : mode);
            }

            for (let year = 2007; year <= (new Date).getUTCFullYear(); year++) {
                let eligibility = await MCAEligibility.findOne({ relations: ["user"], where: { year: year, user: { ID: ctx.state.user.ID }}});
                if (!eligibility) {
                    eligibility = new MCAEligibility();
                    eligibility.year = year;
                    eligibility.user = ctx.state.user;
                }
                for (const eligibleMode of eligibleModes) {
                    if (!eligibility[eligibleMode]) {
                        eligibility[eligibleMode] = true;
                        eligibility.storyboard = true;
                    }
                }
                
                await eligibility.save();
                if (ctx.state.user.mcaEligibility) {
                    const i = ctx.state.user.mcaEligibility.findIndex((e: MCAEligibility) => e.year === year);
                    if (i === -1)
                        ctx.state.user.mcaEligibility.push(eligibility);
                    else
                        ctx.state.user.mcaEligibility[i] = eligibility;
                } else
                    ctx.state.user.mcaEligibility = [ eligibility ];
            }
        }

        await next();
    } catch (e) {
        if (e) {
            ctx.status = 500;
            console.error(e);
            ctx.body = { error: e };
        } else {
            throw e;
        }
    }
}, async ctx => {
    try {
        // MCA data
        const beatmaps = (await Axios.get(`https://osu.ppy.sh/api/get_beatmaps?k=${config.osu.v1.apiKey}&u=${ctx.state.user.osu.userID}`)).data;
        if (beatmaps.length != 0) {
            for (const beatmap of beatmaps) {
                if (!isPossessive(beatmap.version) && (beatmap.approved == 2 || beatmap.approved == 1)) {
                    const date = new Date(beatmap.approved_date);
                    const year = date.getUTCFullYear();
                    let eligibility = await MCAEligibility.findOne({ relations: ["user"], where: { year: year, user: { ID: ctx.state.user.ID }}});
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
            ctx.status = 500;
            console.error(e);
            ctx.body = { error: e };
        } else {
            throw e;
        }
    }
});

export default osuRouter;