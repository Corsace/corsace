import { CorsaceRouter } from "../../../corsaceRouter";
import passport from "koa-passport";
import { discordGuild } from "../../../discord";
import { config } from "node-config-ts";
import { ParameterizedContext } from "koa";
import { redirectToMainDomain } from "./middleware";
import { parseQueryParam } from "../../../utils/query";
import { DiscordAPIError } from "discord.js";

// If you are looking for discord passport info then go to Server > passportFunctions.ts

const discordRouter  = new CorsaceRouter();

discordRouter.$get("/", redirectToMainDomain, async (ctx: ParameterizedContext, next) => {
    const site = parseQueryParam(ctx.query.site);
    if (!site) {
        ctx.body = "No site specified";
        return;
    }
    if (!(site in config)) {
        ctx.body = "Invalid site";
        return;
    }
    const configInfo = config[site as keyof typeof config];
    if (typeof configInfo === "object" && !("publicUrl" in configInfo)) {
        ctx.body = "Invalid config";
        return;
    }

    const baseURL = ctx.query.site ? (typeof configInfo === "object" ? configInfo.publicUrl : config.corsace.publicUrl) : "";
    const params = parseQueryParam(ctx.query.redirect) ?? "";
    const redirectURL = (baseURL + params) ?? "back";
    ctx.cookies.set("redirect", redirectURL, { overwrite: true });
    await next();
}, passport.authenticate("discord", { scope: ["identify", "guilds.join"] }));

discordRouter.$get("/callback", async (ctx: ParameterizedContext, next) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await passport.authenticate("discord", { scope: ["identify", "guilds.join"], failureRedirect: "/" }, async (err, user) => {
        if (user) {
            if (ctx.state.user) {
                ctx.state.user.discord = user.discord;
                user = ctx.state.user;
            } else if (!user.osu)
            {
                ctx.body = { error: "There is no osu! account linked to this discord account! Please register via osu! first." };
                return;
            }

            await user.save();

            try {
                // Add user to server if they aren't there yet
                const guild = await discordGuild();
                try {
                    const discordUser = await guild.members.fetch(user.discord.userID);
                    await Promise.all([
                        discordUser.setNickname(user.osu.username),
                        discordUser.roles.add(config.discord.roles.corsace.verified),
                    ]);
                } catch (e) {
                    await guild.members.add(user.discord.userID, {
                        accessToken: user.discord.accessToken,
                        nick: user.osu.username,
                        roles: [config.discord.roles.corsace.verified, config.discord.roles.corsace.streamAnnouncements],
                    });
                }
            } catch (err) {
                if (!(err instanceof DiscordAPIError) || err.code !== 50007)
                    console.log(`An error occurred in adding a user to the server / changing their nickname: ${err}`);
            }

            ctx.login(user);
            const redirect = ctx.cookies.get("redirect");
            ctx.cookies.set("redirect", "");
            ctx.redirect(redirect ?? "back");
        } else {
            const redirect = ctx.cookies.get("redirect");
            ctx.cookies.set("redirect", "");
            ctx.redirect(redirect ?? "back");
            return;
        }
    })(ctx, next);
});

export default discordRouter;
