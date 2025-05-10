import { CorsaceRouter } from "../../../corsaceRouter";
import passport from "koa-passport";
import { UserAuthenticatedState } from "koa";
import { MCAEligibility } from "../../../../Models/MCA_AYIM/mcaEligibility";
import { config, IRemoteServiceConfig } from "node-config-ts";
import { UsernameChange } from "../../../../Models/usernameChange";
import { osuClient, osuV2Client } from "../../../osu";
import { isPossessive } from "../../../../Models/MCA_AYIM/guestRequest";
import { scopes } from "../../../../Interfaces/osuAPIV2";
import { parseQueryParam } from "../../../utils/query";
import { UserStatistics } from "../../../../Models/userStatistics";
import { Beatmap, Mode } from "nodesu";
import { ModeDivisionType } from "../../../../Interfaces/modes";
import { getStrategy } from "../../../passportFunctions";

// If you are looking for osu! passport info then go to Server > passportFunctions.ts

const osuRouter  = new CorsaceRouter();
const modes = [
    "standard",
    "taiko",
    "fruits",
    "mania",
];

osuRouter.$get("/", async (ctx, next) => {
    const site = parseQueryParam(ctx.query.site);
    if (!site) {
        ctx.body = {
            success: false,
            error: "No site specified",
        };
        return;
    }
    if (!(site in config)) {
        ctx.body = {
            success: false,
            error: "Invalid site",
        };
        return;
    }
    const configInfo = config[site as keyof typeof config];
    if (typeof configInfo !== "object" || !("publicUrl" in configInfo)) {
        ctx.body = {
            success: false,
            error: "Invalid config",
        };
        return;
    }

    const redirect = parseQueryParam(ctx.query.redirect) ?? "";
    ctx.cookies.set("login-redirect", JSON.stringify({ site, redirect }), { overwrite: true });

    const { name: strategyName } = getStrategy("osu", site);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await passport.authenticate(strategyName, { scope: scopes })(ctx, next);
});

osuRouter.$get<object, UserAuthenticatedState>("/callback", async (ctx, next) => {
    const loginRedirectCookie = ctx.cookies.get("login-redirect");
    const loginRedirect = loginRedirectCookie ? JSON.parse(loginRedirectCookie) as { site: keyof typeof config; redirect: string } : { site: "corsace" as const, redirect: "" };
    const { name: strategyName } = getStrategy("osu", loginRedirect.site);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await passport.authenticate(strategyName, { scope: scopes, failureRedirect: "/" }, async (err, user) => {
        if (user) {
            await user.save();
            ctx.login(user);
            await next();
        } else {
            ctx.cookies.set("login-redirect", "");
            const sitePublicUrl = (config[loginRedirect.site] as IRemoteServiceConfig).publicUrl;
            ctx.redirect(`${sitePublicUrl}${loginRedirect.redirect}`);
            return;
        }
    })(ctx, next);
}, async (ctx, next) => {
    try {
        // api v2 data
        const data = await osuV2Client.getMe(ctx.state.user.osu.accessToken!);

        // User Statistics
        ctx.state.user.userStatistics = await UserStatistics
            .createQueryBuilder("userStatistics")
            .innerJoinAndSelect("userStatistics.user", "user")
            .innerJoinAndSelect("userStatistics.modeDivision", "mode")
            .where("user.ID = :ID", { ID: ctx.state.user.ID })
            .getMany();
        await Promise.all(Object.values(ModeDivisionType)
            .filter(mode => typeof mode === "number")
            .map(modeID => ctx.state.user.refreshStatistics(modeID as ModeDivisionType, data)));

        // Username changes
        const usernames: string[] = data.previous_usernames ?? [];
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
                nameChange = new UsernameChange();
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
        if (data.groups?.some(group => [11, 22, 33, 28, 32, 7, 31].some(num => group.id === num))) {
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

            for (let year = 2007; year <= (new Date()).getUTCFullYear(); year++) {
                let eligibility = await MCAEligibility.findOne({ relations: ["user"], where: { year: year, user: { ID: ctx.state.user.ID }}});
                if (!eligibility) {
                    eligibility = new MCAEligibility();
                    eligibility.year = year;
                    eligibility.user = ctx.state.user;
                }
                for (const eligibleMode of eligibleModes) {
                    if (eligibleMode in ModeDivisionType) {
                        eligibility[eligibleMode as keyof typeof ModeDivisionType] = true;
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
            ctx.body = {
                success: false, 
                error: typeof e === "string" ? e : "Internal server error",
            };
        } else {
            throw e;
        }
    }
}, async ctx => {
    try {
        // MCA data
        ctx.state.user.mcaEligibility = ctx.state.user.mcaEligibility || [];

        // TODO: Replace this with osu!apiv2 because that actually has pagination, currently will cause issues if a user ranked more than 500 difficulties
        const beatmaps = await osuClient.beatmaps.getByUser(ctx.state.user.osu.userID, Mode.all, undefined, undefined, "id") as Beatmap[];
        if (beatmaps.length != 0) {
            for (const beatmap of beatmaps) {
                if (!isPossessive(beatmap.version) && (beatmap.approved == 2 || beatmap.approved == 1)) {
                    const date = new Date(beatmap.approvedDate);
                    const year = date.getUTCFullYear();
                    let eligibility = await MCAEligibility.findOne({ relations: ["user"], where: { year: year, user: { ID: ctx.state.user.ID }}});
                    if (!eligibility) {
                        eligibility = new MCAEligibility();
                        eligibility.year = year;
                        eligibility.user = ctx.state.user;
                    }
                    
                    const mode = modes[beatmap.mode ?? 0];
                    if (mode in ModeDivisionType) {
                        eligibility[mode as keyof typeof ModeDivisionType] = true;
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

        const loginRedirectCookie = ctx.cookies.get("login-redirect");
        const loginRedirect = loginRedirectCookie ? JSON.parse(loginRedirectCookie) as { site: keyof typeof config; redirect: string } : { site: "corsace" as const, redirect: "" };
        ctx.cookies.set("login-redirect", "");
        const sitePublicUrl = (config[loginRedirect.site] as IRemoteServiceConfig).publicUrl;
        ctx.redirect(`${sitePublicUrl}${loginRedirect.redirect}`);
    } catch (e) {
        if (e) {
            ctx.status = 500;
            console.error(e);
            ctx.body = {
                success: false, 
                error: typeof e === "string" ? e : "Internal server error",
            };
        } else {
            throw e;
        }
    }
});

export default osuRouter;
