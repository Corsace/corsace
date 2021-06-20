import Router from "@koa/router";
import passport from "koa-passport";
import { discordGuild } from "../../../../Server/discord";
import { config } from "node-config-ts";
import { ParameterizedContext } from "koa";

// If you are looking for discord passport info then go to Server > passportFunctions.ts

const discordRouter = new Router();

discordRouter.get("/", async (ctx: ParameterizedContext<any>, next) => {
    ctx.cookies.set("redirect", ctx.query.redirect ?? "back", { overwrite: true });
    await next();
}, passport.authenticate("discord", { scope: ["identify", "guilds.join"] }));
discordRouter.get("/callback", async (ctx: ParameterizedContext, next) => {
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
                    let discordUser = await guild.members.fetch(user.discord.userID);
                    await Promise.all([
                        discordUser.setNickname(user.osu.username),
                        discordUser.roles.add(config.discord.roles.corsace.verified)
                    ]);
                } catch (e) {
                    await guild.addMember(user.discord.userID, {
                        accessToken: user.discord.accessToken,
                        nick: user.osu.username,
                        roles: [config.discord.roles.corsace.verified],
                    });
                }
            } catch (err) {
                console.log("An error occurred in adding a user to the server / changing their nickname: " + err);
            }

            ctx.login(user);
            const redirect = ctx.cookies.get("redirect");
            ctx.cookies.set("redirect", "");
            ctx.redirect(redirect ?? "back");
        } else {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    })(ctx, next);
});

export default discordRouter;
