import Router from "@koa/router";
import Axios from "axios";
import { User } from "../../../Models/user";

const mappersRouter = new Router();

mappersRouter.get("/search", async (ctx) => {
    if (!ctx.query.year)
        return ctx.body = {
            error: "No year given!",
        };

    if (/\d+/.test(ctx.query.skip))
        ctx.query.skip = parseInt(ctx.query.skip);
    else
        ctx.query.skip = 0;
    
    if (ctx.query.friendFilter === "true") {
        if (!ctx.state.user)
            return ctx.body = { error: "Please login via osu! to use the friends filter!" };
        try {
            const accessToken: string = await ctx.state.user.getAccessToken("osu");
            const res = await Axios.get("https://osu.ppy.sh/api/v2/friends", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            ctx.query.friends = res.data.map(friend => friend.id);
        } catch (e) {"";
            if (Axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403)) 
                return ctx.body = { error: "Please re-login via osu! again in order to use the friends filter! If you logged in again via osu! and it still isn't working, contact VINXIS!" };
            else 
                throw e;
        }
    }

    ctx.body = await User.basicSearch(ctx.query);
});

export default mappersRouter;
