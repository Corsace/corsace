import Router from "@koa/router";
import passport from "koa-passport";
import { discordGuild } from "../../../../Server/discord";
import { Config } from "../../../../config";
import { ParameterizedContext } from "koa";

// If you are looking for discord passport info then go to Server > passportFunctions.ts

const discordRouter = new Router();
const config = new Config();

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
                let discordUser = await (await discordGuild()).members.fetch(user.discord.userID);
                if (!discordUser) {
                    discordUser = await (await discordGuild()).addMember(user.discord.userID, {
                        accessToken: user.discord.accessToken,
                        nick: user.osu.username,
                        roles: [config.discord.roles.corsace.verified],
                    });
                } else {
                    await discordUser.setNickname(user.osu.username);
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