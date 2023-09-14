import Router from "@koa/router";
import Axios from "axios";
import { User } from "../../../Models/user";
import { MapperQuery } from "../../../Interfaces/queries";
import { parseQueryParam } from "../../../Server/utils/query";
import { osuV2Client } from "../../osu";

const mappersRouter = new Router();

mappersRouter.get("/search", async (ctx) => {
    if (!ctx.query.year)
        return ctx.body = {
            success: false,
            error: "No year given!",
        };

    const skip = parseInt(parseQueryParam(ctx.query.skip) ?? "") ?? 0;
    const order = parseQueryParam(ctx.query.order);
    if (order !== undefined && order !== "ASC" && order !== "DESC")
        return ctx.body = {
            success: false,
            error: "order must be undefined, ASC or DESC",
        };

    const query: MapperQuery = {
        text: parseQueryParam(ctx.query.text) ?? "",
        skip: String(skip),
        year: parseQueryParam(ctx.query.year)!,
        mode: parseQueryParam(ctx.query.mode),
        option: parseQueryParam(ctx.query.option),
        notCommented: parseQueryParam(ctx.query.notCommented),
        order: order,
    };
    
    if (ctx.query.friendFilter === "true") {
        if (!ctx.state.user)
            return ctx.body = {
                success: false,
                error: "Please login via osu! to use the friends filter!",
            };
        try {
            const accessToken: string = await ctx.state.user.getAccessToken("osu");
            const data = await osuV2Client.getUserFriends(accessToken);
            query.friends = data.map(friend => friend.id);
        } catch (e) {
            if (Axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403)) 
                return ctx.body = { 
                    success: false,
                    error: "Please re-login via osu! again in order to use the friends filter! If you logged in again via osu! and it still isn't working, contact VINXIS!",
                };
            else 
                throw e;
        }
    }

    ctx.body = {
        success: true,
        users: await User.basicSearch(query),
    };
});

export default mappersRouter;
