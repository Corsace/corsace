import { CorsaceRouter } from "../../corsaceRouter";
import axios from "axios";
import { User } from "../../../Models/user";
import { MapperQuery } from "../../../Interfaces/queries";
import { parseQueryParam } from "../../utils/query";
import { isCorsace, isLoggedInDiscord } from "../../middleware";
import { osuV2Client } from "../../osu";

const usersRouter  = new CorsaceRouter();

usersRouter.$get("/search", async (ctx) => {
    const userSearch = ctx.query.user;
    const users = await User
        .createQueryBuilder("user")
        .leftJoin("user.otherNames", "otherName")
        .where("user.osuUserid = :userId", { userId: userSearch })
        .orWhere("user.osuUsername LIKE :user")
        .orWhere("otherName.name LIKE :user")
        .setParameter("user", `%${userSearch}%`)
        .limit(10)
        .getMany();

    ctx.body = {
        success: true,
        users,
    };
});

usersRouter.$get("/advSearch", async (ctx) => {
    if (!ctx.query.year)
        return ctx.body = {
            error: "No year given!",
        };

    const skip = parseInt(parseQueryParam(ctx.query.skip) ?? "") || 0;
    const order = parseQueryParam(ctx.query.order);
    if (order !== undefined && order !== "ASC" && order !== "DESC")
        return ctx.body = {
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
            return ctx.body = { error: "Please login via osu! to use the friends filter!" };
        try {
            const accessToken: string = await ctx.state.user.getAccessToken("osu");
            const friends = await osuV2Client.getUserFriends(accessToken);
            query.friends = friends.map(friend => friend.id);
        } catch (e) {
            if (axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403)) 
                return ctx.body = { error: "Please re-login via osu! again in order to use the friends filter! If you logged in again via osu! and it still isn't working, contact VINXIS!" };
            else 
                throw e;
        }
    }

    ctx.body = await User.basicSearch(query);
});

usersRouter.$get("/deepSearch", isLoggedInDiscord, isCorsace, async (ctx) => {
    const userSearch = ctx.query.user;
    const users = await User
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.otherNames", "otherName")
        .leftJoinAndSelect("user.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .leftJoinAndSelect("user.teams", "team")
        .leftJoinAndSelect("team.tournaments", "tournament")
        .leftJoinAndSelect("user.mcaEligibility", "mcaEligibility")
        .leftJoinAndSelect("user.teamsManaged", "teamManaged")
        .leftJoinAndSelect("teamManaged.tournaments", "tournamentManaged")
        .where("user.osuUserid = :userId", { userId: userSearch })
        .orWhere("user.osuUsername LIKE :user")
        .orWhere("otherName.name LIKE :user")
        .setParameter("user", `%${userSearch}%`)
        .limit(10)
        .getMany();

    ctx.body = users;
});

export default usersRouter;
