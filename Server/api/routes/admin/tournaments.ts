import Router, { Middleware } from "@koa/router";
import { isCorsace, isLoggedInDiscord } from "../../../middleware";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { cache } from "../../../../Server/cache";
import { BracketGenerator } from "../../../../Models/tournaments/bracket";
import { Qualifier } from "../../../../Models/tournaments/qualifier";

const adminTournamentsRouter = new Router;
const bracketGenerator = new BracketGenerator;
const qualifierGenerator = new Qualifier;

adminTournamentsRouter.use(isLoggedInDiscord);
adminTournamentsRouter.use(isCorsace);

const validate: Middleware = async (ctx, next) => {
    const data = ctx.request.body;

    if (!data.year) {
        return ctx.body = { error: "Missing year!" };
    } else if (!data.tourney) {
        return ctx.body = { error: "Missing Corsace tournament type!" };
    } else if (!data.size) {
        return ctx.body = { error: "Missing tournament size!" };
    }

    await next();
};

// Endpoint for creating a Corsace Open/Closed tournament
adminTournamentsRouter.post("/", validate, async (ctx) => {
    const data = ctx.request.body;

    let tournament = await Tournament.findOne({
        year: data.year,
        isOpen: data.tourney === "open",
        isClosed: data.tourney === "closed",
    });
    if (tournament)
        return ctx.body = { error: `This year's edition of Corsace ${data.open ? "open" : "closed"} already exists!` };

    // Create the tournament
    tournament = await Tournament.generateCorsaceTournament(data);

    // Create tournament brackets based on tournament size
    const brackets = await bracketGenerator.generateBrackets(tournament);
    await Promise.all(brackets.map(bracket => bracket.save()));

    // Create either qualifiers or groups based on data given
    if (data.qualifier) {
        const qualifiers = await qualifierGenerator.generateQualifiers(tournament);
        await Promise.all(qualifiers.map(qualifier => qualifier.save()));
    } else {
        const groups = await qualifierGenerator.generateGroups(tournament);
        await Promise.all(groups.map(group => group.save()));
    }

    cache.del("/api/tournaments/front?year=" + data.year);
    cache.del("/api/tournaments?year=" + data.year);
    cache.del("/api/staff");

    ctx.body = {
        success: true
    };
});