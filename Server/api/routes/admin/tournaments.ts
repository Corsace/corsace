import Router, { Middleware } from "@koa/router";
import { isCorsace, isLoggedInDiscord } from "../../../middleware";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { cache } from "../../../../Server/cache";
import { BracketGenerator } from "../../../../Models/tournaments/bracket";
import { QualifierGenerator } from "../../../../Models/tournaments/qualifier";
import { GroupGenerator } from "../../../../Models/tournaments/group";

const adminTournamentsRouter = new Router;
const bracketGenerator = new BracketGenerator;
const qualifierGenerator = new QualifierGenerator;
const groupGenerator = new GroupGenerator;

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
    } else if (!data.brackets) {
        return ctx.body = { error: "Missing tournament bracket info!" };
    } else if (!data.qualStart) {
        return ctx.body = { error: "Missing tournament qualifier start date!" };
    } else if (!data.seedingType) {
        return ctx.body = { error: "Missing tournament seeding type!" };
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
    tournament = (await Tournament.generateCorsaceTournament(data)) as Tournament;

    try {
        // Create tournament brackets based on tournament size
        await bracketGenerator.generateBrackets(tournament, data.brackets);

        // Create either qualifiers or groups based on data given
        if (data.seedingType === "qualifier")
            await qualifierGenerator.generateQualifiers(tournament, data.qualStart);
        else
            await groupGenerator.generateGroups(tournament);

    } catch (err: any) {
        if (err) 
            return ctx.body = { error: err.message };
    }

    cache.del("/api/tournaments?year=" + data.year);
    cache.del("/api/staff");

    ctx.body = {
        success: true
    };
});

export default adminTournamentsRouter;