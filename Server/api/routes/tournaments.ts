import Router from "@koa/router";
import { Tournament } from "../../../Models/tournaments/tournament";
import { parseQueryParam } from "../../utils/query";

const tournamentsRouter = new Router;

tournamentsRouter.get("/", async (ctx) => {
    if (await ctx.cashed())
        return;

    const year = parseInt(parseQueryParam(ctx.query.year) || "") || undefined;
    const skip = parseInt(parseQueryParam(ctx.query.skip) || "") || 0;
    const queryBuilder = Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "teams");

    if (year)
        queryBuilder.where("tournament.year = :year", { year });
    
    return queryBuilder
        .skip(skip)
        .take(50)
        .getMany();
});

tournamentsRouter.get("/:id", async (ctx) => {
    if (await ctx.cashed())
        return;
    
    const tournament = await Tournament.findOne(ctx.params.id);
    if (!tournament)
        return ctx.body = { error: "Tournament not found!" };

    return tournament.getInfo();
});

export default tournamentsRouter;