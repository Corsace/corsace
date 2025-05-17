import { CorsaceContext, CorsaceRouter } from "../../../corsaceRouter";
import passport from "koa-passport";
import { discordGuild } from "../../../discord";
import { config, IRemoteServiceConfig, IWebServiceConfig } from "node-config-ts";
import { parseQueryParam } from "../../../utils/query";
import { DiscordAPIError } from "discord.js";
import { getStrategy } from "../../../passportFunctions";

// If you are looking for discord passport info then go to Server > passportFunctions.ts

const discordRouter  = new CorsaceRouter();

discordRouter.$get("/", async (ctx: CorsaceContext<object>, next) => {
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
    if (typeof configInfo !== "object" || !("publicUrl" in configInfo) || !configInfo.publicUrl) {
        ctx.body = {
            success: false,
            error: "Invalid config",
        };
        return;
    }

    const redirect = parseQueryParam(ctx.query.redirect) ?? "";
    ctx.cookies.set("login-redirect", JSON.stringify({ site, redirect }), { overwrite: true });

    const { name: strategyName } = getStrategy("discord", site);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await passport.authenticate(strategyName, { scope: ["identify", "guilds.join"] })(ctx, next);
});

discordRouter.$get("/callback", async (ctx: CorsaceContext<object>, next) => {
    const loginRedirectCookie = ctx.cookies.get("login-redirect");
    const loginRedirect = loginRedirectCookie ? JSON.parse(loginRedirectCookie) as { site: keyof typeof config; redirect: string } : { site: "corsace" as const, redirect: "" };
    const { name: strategyName } = getStrategy("discord", loginRedirect.site);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await passport.authenticate(strategyName, { scope: ["identify", "guilds.join"], failureRedirect: "/" }, async (err, user) => {
        if (user) {
            if (ctx.state.user) {
                ctx.state.user.discord = user.discord;
                user = ctx.state.user;
            } else if (!user.osu)
            {
                ctx.body = {
                    success: false,
                    error: "There is no osu! account linked to this discord account! Please register via osu! first.",
                };
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
                    if ((config[loginRedirect.site] as IWebServiceConfig).host) {
                        await guild.members.add(user.discord.userID, {
                            accessToken: user.discord.accessToken,
                            nick: user.osu.username,
                            roles: [config.discord.roles.corsace.verified, config.discord.roles.corsace.streamAnnouncements],
                        });
                    }
                }
            } catch (e) {
                if (!(e instanceof DiscordAPIError) || e.code !== 50007)
                    console.log(`An error occurred in adding a user to the server / changing their nickname: ${e}`);
            }

            ctx.login(user);
        }
        ctx.cookies.set("login-redirect", "");
        const sitePublicUrl = (config[loginRedirect.site] as IRemoteServiceConfig).publicUrl;
        ctx.redirect(`${sitePublicUrl}${loginRedirect.redirect}`);
    })(ctx, next);
});

export default discordRouter;
