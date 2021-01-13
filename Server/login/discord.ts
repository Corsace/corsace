import Router from "@koa/router";
import passport from "koa-passport";
import { discordGuild } from "../discord";
import { Config } from "../../config";
import { ParameterizedContext } from "koa";

const discordRouter = new Router();
const config = new Config();

discordRouter.get("/", passport.authenticate("discord", { scope: ["identify", "guilds.join"]}));
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
            ctx.redirect("back");
        } else {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    })(ctx, next);
});

export default discordRouter;