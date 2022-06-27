import Router from "@koa/router";
import { Team } from "../../../Models/tournaments/team";
import { Tournament } from "../../../Models/tournaments/tournament";
import { isManager, isNotInTournament, membersNotInTournament } from "../../middleware/tournaments";

const teamRouter = new Router;

// Get list of teams user is in
teamRouter.get("/", async (ctx) => {
    return await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .where("member.ID = :userID", { userID: ctx.state.user.ID })
        .orWhere("manager.ID = :userID", { userID: ctx.state.user.ID })
        .getMany();
});

// Get list of teams in a specified tournament
teamRouter.get("/:tournament/teams", async (ctx) => {
    if (await ctx.cashed())
        return;

    const tournament = await Tournament.findOne(ctx.params.tournament);
    if (!tournament)
        return ctx.body = { error: "Tournament not found!" };

    return tournament.getTeams();
});

// Create a team for a tournament NEED TO FINISH THIS ONE
teamRouter.post("/:tournament/create", isNotInTournament, async (ctx) => {
    const tournament = await Tournament.findOne(ctx.params.tournament);
    if (!tournament)
        return ctx.body = { error: "Tournament not found!" };

    const team = new Team;
    team.name = ctx.
    
    await Team.create({
        name: ctx.request.body.name,
        manager: ctx.state.user,
        tournament
    });

    return team.getInfo();
});

// Join tournament with a pre-made team
teamRouter.post("/:tournament/:team/join", isManager, membersNotInTournament, async (ctx) => {
    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "teams")
        .where("tournament.ID = :tournament", { tournament: ctx.params.tournament })
        .getOne();
    if (!tournament)
        return ctx.body = { error: "Tournament not found!" };

    tournament.teams.push(ctx.state.team);
    await tournament.save();

    return ctx.body = { success: "Team joined tournament!" };
});

// Leave tournament with a pre-made team
teamRouter.post("/:tournament/:team/leave", isManager, async (ctx) => {
    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "teams")
        .where("tournament.ID = :tournament", { tournament: ctx.params.tournament })
        .getOne();
    if (!tournament)
        return ctx.body = { error: "Tournament not found!" };

    tournament.teams.filter(team => team.ID !== ctx.state.team.ID);
    await tournament.save();

    return ctx.body = { success: "Team left tournament!" };
});