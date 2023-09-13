import Router from "@koa/router";
import { TournamentRoleType, unallowedToPlay } from "../../../../Interfaces/tournament";
import { Matchup as MatchupInterface } from "../../../../Interfaces/matchup";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Stage } from "../../../../Models/tournaments/stage";
import { Round } from "../../../../Models/tournaments/round";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { discordClient } from "../../../discord";
import { isLoggedInDiscord } from "../../../middleware";
import { hasRoles, validateTournament } from "../../../middleware/tournament";
import { parseQueryParam } from "../../../utils/query";
import dbMatchupToInterface from "../../../functions/tournaments/matchups/dbMatchupToInterface";

const refereeMatchupsRouter = new Router();

//TODO: Look into making refereeRouter.use work for the middleware functions

refereeMatchupsRouter.get("/:tournamentID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchupQ = Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.round", "round")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team1.manager", "manager1")
        .leftJoinAndSelect("team2.manager", "manager2")
        .leftJoinAndSelect("team1.members", "members1")
        .leftJoinAndSelect("team2.members", "members2")
        .leftJoinAndSelect("matchup.winner", "winner")
        .leftJoinAndSelect("matchup.potentialFor", "potentialFor")
        .leftJoin("matchup.referee", "referee")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .andWhere("matchup.potentialFor IS NULL");

    // For organizers to see all matchups
    const roles = await TournamentRole
        .createQueryBuilder("role")
        .innerJoin("role.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .getMany();
    let bypass = false;
    if (roles.length > 0) {
        try {
            const organizerRoles = roles.filter(r => r.roleType === TournamentRoleType.Organizer);
            const tournamentServer = await discordClient.guilds.fetch(ctx.state.tournament.server);
            const discordMember = await tournamentServer.members.fetch(ctx.state.user.discord.userID);
            bypass = organizerRoles.some(r => discordMember.roles.cache.has(r.roleID));
        } catch (e) {
            bypass = false;
        }
    }

    if (!bypass)
        matchupQ
            .andWhere("referee.ID = :refereeID", { refereeID: ctx.state.user.ID });
        
    const skip = parseInt(parseQueryParam(ctx.query.skip) ?? "") ?? 0;
    const matchups = await matchupQ
        .skip(skip)
        .take(5)
        .orderBy("matchup.ID", "DESC")
        .getMany();

    ctx.body = {
        success: true,
        matchups: await Promise.all(matchups.map(async m => await dbMatchupToInterface(m, null))),
    };
});

refereeMatchupsRouter.get("/:tournamentID/:matchupID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchupQ = Matchup
        .createQueryBuilder("matchup")
        // round and stage
        .leftJoinAndSelect("matchup.round", "round")
        .innerJoinAndSelect("matchup.stage", "stage")
        // tournament
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.referee", "referee")
        // teams
        .leftJoinAndSelect("matchup.teams", "teams")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("teams.manager", "manager")
        .leftJoinAndSelect("team1.manager", "manager1")
        .leftJoinAndSelect("team2.manager", "manager2")
        .leftJoinAndSelect("teams.members", "members")
        .leftJoinAndSelect("team1.members", "members1")
        .leftJoinAndSelect("team2.members", "members2")
        .leftJoinAndSelect("matchup.winner", "winner")
        // maps
        .leftJoinAndSelect("matchup.sets", "set")
        .leftJoinAndSelect("set.first", "first")
        .leftJoinAndSelect("set.maps", "maps")
        .leftJoinAndSelect("maps.map", "map")
        .leftJoinAndSelect("map.slot", "slot")
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID });

    // TODO: Add x amount of latest messages to the query, and support scrolling pagination on ref page and matchup page

    // For organizers to see all matchups
    const roles = await TournamentRole
        .createQueryBuilder("role")
        .innerJoin("role.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .getMany();
    let bypass = false;
    if (roles.length > 0) {
        try {
            const privilegedRoles = roles.filter(r => unallowedToPlay.some(u => u === r.roleType));
            const tournamentServer = await discordClient.guilds.fetch(ctx.state.tournament.server);
            const discordMember = await tournamentServer.members.fetch(ctx.state.user.discord.userID);
            bypass = privilegedRoles.some(r => discordMember.roles.cache.has(r.roleID));
        } catch (e) {
            bypass = false;
        }
    }

    if (!bypass)
        matchupQ
            .andWhere("referee.ID = :refereeID", { refereeID: ctx.state.user.ID });
        
    const dbMatchup = await matchupQ.getOne();

    if (!dbMatchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found.",
        };
        return;
    }

    const roundOrStage: Round | Stage | null = 
        dbMatchup.round ? 
            await Round
                .createQueryBuilder("round")
                .innerJoin("round.matchups", "matchup")
                .leftJoinAndSelect("round.mappool", "mappool")
                .leftJoinAndSelect("mappool.slots", "slots")
                .leftJoinAndSelect("slots.maps", ",mps")
                .leftJoinAndSelect("maps.beatmap", "map")
                .leftJoinAndSelect("map.beatmapset", "beatmapset")
                .leftJoinAndSelect("round.mapOrder", "mapOrder")
                .where("matchup.ID = :ID", { ID: dbMatchup.ID })
                .getOne() :
            dbMatchup.stage ?
                await Stage
                    .createQueryBuilder("stage")
                    .innerJoin("stage.matchups", "matchup")
                    .leftJoinAndSelect("stage.mappool", "mappool")
                    .leftJoinAndSelect("mappool.slots", "slots")
                    .leftJoinAndSelect("slots.maps", "maps")
                    .leftJoinAndSelect("maps.beatmap", "map")
                    .leftJoinAndSelect("map.beatmapset", "beatmapset")
                    .leftJoinAndSelect("stage.mapOrder", "mapOrder")
                    .where("matchup.ID = :ID", { ID: dbMatchup.ID })
                    .getOne() : 
                null;

    const body: {
        success: true;
        matchup: MatchupInterface;
    } = {
        success: true,
        matchup: await dbMatchupToInterface(dbMatchup, roundOrStage),
    };
    
    ctx.body = body;
});

export default refereeMatchupsRouter;
