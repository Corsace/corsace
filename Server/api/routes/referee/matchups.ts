import Router from "@koa/router";
import { TournamentRoleType, unallowedToPlay } from "../../../../Interfaces/tournament";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Stage } from "../../../../Models/tournaments/stage";
import { Round } from "../../../../Models/tournaments/round";
import { Matchup as MatchupInterface } from "../../../../Interfaces/matchup";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { Mappool } from "../../../../Interfaces/mappool";
import { discordClient } from "../../../discord";
import { isLoggedInDiscord } from "../../../middleware";
import { hasRoles, validateTournament } from "../../../middleware/tournament";
import { parseQueryParam } from "../../../utils/query";

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
        
    const skip = parseInt(parseQueryParam(ctx.query.skip) || "") || 0;
    const matchups = await matchupQ
        .skip(skip)
        .take(5)
        .getMany();

    ctx.body = {
        success: true,
        matchups,
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
        // other teams
        .leftJoinAndSelect("matchup.first", "first")
        .leftJoinAndSelect("matchup.winner", "winner")
        // maps
        .leftJoinAndSelect("matchup.maps", "maps")
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

    const team1 = dbMatchup.team1 ? await dbMatchup.team1.teamInterface() : undefined;
    const team2 = dbMatchup.team2 ? await dbMatchup.team2.teamInterface() : undefined;
    const first = dbMatchup.first?.ID === team1?.ID ? team1 : dbMatchup.first?.ID === team2?.ID ? team2 : undefined;
    const winner = dbMatchup.winner?.ID === team1?.ID ? team1 : dbMatchup.winner?.ID === team2?.ID ? team2 : undefined;

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

    const matchup: MatchupInterface = {
        ID: dbMatchup.ID,
        date: dbMatchup.date,
        mp: dbMatchup.mp,
        teams: await Promise.all(dbMatchup.teams?.map(team => team.teamInterface()) || []),
        team1,
        team2,
        team1Score: dbMatchup.team1Score,
        team2Score: dbMatchup.team2Score,
        potential: !dbMatchup.potentialFor,
        baseURL: dbMatchup.baseURL,
        round: roundOrStage instanceof Round ? {
            ID: roundOrStage.ID,
            name: roundOrStage.name,
            abbreviation: roundOrStage.abbreviation,
            mappool: roundOrStage.mappool?.map<Mappool>(mappool => ({
                ID: mappool.ID,
                name: mappool.name,
                abbreviation: mappool.abbreviation,
                createdAt: mappool.createdAt,
                order: mappool.order,
                isPublic: mappool.isPublic,
                bannable: mappool.bannable,
                mappackLink: mappool.mappackLink,
                mappackExpiry: mappool.mappackExpiry,
                targetSR: mappool.targetSR,
                slots: mappool.slots || [],
            })) || [],
            isDraft: roundOrStage.isDraft,
            mapOrder: roundOrStage.mapOrder,
        } : undefined,
        stage: roundOrStage instanceof Stage ? {
            ID: roundOrStage.ID,
            name: roundOrStage.name,
            abbreviation: roundOrStage.abbreviation,
            stageType: roundOrStage.stageType,
            rounds: [],
            mappool: roundOrStage.mappool?.map<Mappool>(mappool => ({
                ID: mappool.ID,
                name: mappool.name,
                abbreviation: mappool.abbreviation,
                createdAt: mappool.createdAt,
                order: mappool.order,
                isPublic: mappool.isPublic,
                bannable: mappool.bannable,
                mappackLink: mappool.mappackLink,
                mappackExpiry: mappool.mappackExpiry,
                targetSR: mappool.targetSR,
                slots: mappool.slots || [],
            })) || [],
            createdAt: roundOrStage.createdAt,
            order: roundOrStage.order,
            scoringMethod: roundOrStage.scoringMethod,
            isDraft: roundOrStage.isDraft,
            qualifierTeamChooseOrder: roundOrStage.qualifierTeamChooseOrder,
            timespan: roundOrStage.timespan,
            isFinished: roundOrStage.isFinished,
            initialSize: roundOrStage.initialSize,
            finalSize: roundOrStage.finalSize,
            mapOrder: roundOrStage.mapOrder,
        } : undefined,
        isLowerBracket: dbMatchup.isLowerBracket,
        first,
        winner,
        maps: dbMatchup.maps,
        mappoolsBanned: dbMatchup.mappoolsBanned,
        forfeit: dbMatchup.forfeit,
        referee: dbMatchup.referee,
        streamer: dbMatchup.streamer,
        commentators: dbMatchup.commentators,
        messages: dbMatchup.messages,
    };

    ctx.body = {
        success: true,
        matchup,
    };
});

export default refereeMatchupsRouter;