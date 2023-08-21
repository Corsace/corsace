import Router from "@koa/router";
import { TournamentRoleType, unallowedToPlay } from "../../../../Interfaces/tournament";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Stage } from "../../../../Models/tournaments/stage";
import { Round } from "../../../../Models/tournaments/round";
import { Matchup as MatchupInterface } from "../../../../Interfaces/matchup"; 
import { Team as TeamInterface } from "../../../../Interfaces/team";
import { Team } from "../../../../Models/tournaments/team";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { Mappool } from "../../../../Interfaces/mappool";
import { discordClient } from "../../../discord";
import { isLoggedInDiscord } from "../../../middleware";
import { hasRoles, validateTournament } from "../../../middleware/tournament";
import { parseQueryParam } from "../../../utils/query";

const refereeMatchupsRouter = new Router();

//TODO: Look into making refereeRouter.use work for the middleware functions
function convertTeam(team: Team): TeamInterface;
function convertTeam(team: null | undefined): undefined;
function convertTeam (team: Team | null | undefined): TeamInterface | undefined
function convertTeam (team: Team | null | undefined): TeamInterface | undefined {
    return team ? {
        ID: team.ID,
        name: team.name,
        abbreviation: team.abbreviation,
        timezoneOffset: team.timezoneOffset,
        avatarURL: team.avatarURL,
        pp: team.pp,
        rank: team.rank,
        BWS: team.BWS,
        manager: {
            ID: team.manager.ID,
            username: team.manager.osu.username,
            osuID: team.manager.osu.userID,
            BWS: 0,
            isManager: true,
        },
        members: team.members.map(member => ({
            ID: member.ID,
            username: member.osu.username,
            osuID: member.osu.userID,
            BWS: 0,
            isManager: member.ID === team.manager.ID,
        })),
    } : undefined;
}

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

    const first = dbMatchup.first?.ID === dbMatchup.team1?.ID ? dbMatchup.team1 : dbMatchup.first?.ID === dbMatchup.team2?.ID ? dbMatchup.team2 : undefined;
    const winner = dbMatchup.winner?.ID === dbMatchup.team1?.ID ? dbMatchup.team1 : dbMatchup.winner?.ID === dbMatchup.team2?.ID ? dbMatchup.team2 : undefined;

    const roundOrStage: Round | Stage | null = 
        dbMatchup.round ? 
            await Round
                .createQueryBuilder("round")
                .innerJoin("round.matchups", "matchup")
                .leftJoinAndSelect("round.mappool", "roundMappool")
                .leftJoinAndSelect("roundMappool.slots", "roundSlots")
                .leftJoinAndSelect("roundSlots.maps", "roundMaps")
                .leftJoinAndSelect("roundMaps.beatmap", "roundMap")
                .leftJoinAndSelect("roundMap.beatmapset", "roundBeatmapset")
                .leftJoinAndSelect("round.mapOrder", "roundMapOrder")
                .where("matchup.ID = :ID", { ID: dbMatchup.ID })
                .getOne() :
            dbMatchup.stage ?
                await Stage
                    .createQueryBuilder("stage")
                    .innerJoin("stage.matchups", "matchup")
                    .leftJoinAndSelect("stage.mappool", "stageMappool")
                    .leftJoinAndSelect("stageMappool.slots", "stageSlots")
                    .leftJoinAndSelect("stageSlots.maps", "stageMaps")
                    .leftJoinAndSelect("stageMaps.beatmap", "stageMap")
                    .leftJoinAndSelect("stageMap.beatmapset", "stageBeatmapset")
                    .leftJoinAndSelect("stage.mapOrder", "stageMapOrder")
                    .where("matchup.ID = :ID", { ID: dbMatchup.ID })
                    .getOne() : 
                null;

    const matchup: MatchupInterface = {
        ID: dbMatchup.ID,
        date: dbMatchup.date,
        mp: dbMatchup.mp,
        teams: dbMatchup.teams?.map<TeamInterface>(team => convertTeam(team)),
        team1: convertTeam(dbMatchup.team1),
        team2: convertTeam(dbMatchup.team2),
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
        first: convertTeam(first),
        winner: convertTeam(winner),
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