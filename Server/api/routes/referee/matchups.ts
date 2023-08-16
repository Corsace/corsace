import Router from "@koa/router";
import { TournamentRoleType, unallowedToPlay } from "../../../../Interfaces/tournament";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { discordClient } from "../../../discord";
import { isLoggedInDiscord } from "../../../middleware";
import { hasRoles, validateTournament } from "../../../middleware/tournament";

const refereeMatchupsRouter = new Router();

//TODO: Look into making refereeRouter.use work for the middleware functions

refereeMatchupsRouter.get("/:tournamentID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchupQ = Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.referee", "referee")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.round", "round")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team1.manager", "manager1")
        .leftJoinAndSelect("team2.manager", "manager2")
        .leftJoinAndSelect("team1.members", "members1")
        .leftJoinAndSelect("team2.members", "members2")
        .leftJoinAndSelect("matchup.winner", "winner")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID });
    
    // If not organizer check if they are referee
    const roles = await TournamentRole
        .createQueryBuilder("role")
        .innerJoin("role.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .getMany();
    
    // For organizers to see all matchups
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
        
    const matchups = await matchupQ.getMany();

    ctx.body = {
        success: true,
        matchups,
    };
});

refereeMatchupsRouter.get("/:tournamentID/:matchupID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.round", "round")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team1.manager", "manager1")
        .leftJoinAndSelect("team2.manager", "manager2")
        .leftJoinAndSelect("team1.members", "members1")
        .leftJoinAndSelect("team2.members", "members2")
        .leftJoinAndSelect("matchup.first", "first")
        .leftJoinAndSelect("matchup.winner", "winner")
        .leftJoinAndSelect("matchup.maps", "maps")
        .leftJoinAndSelect("maps.map", "map")
        .leftJoinAndSelect("map.slot", "slot")
        .leftJoinAndSelect("maps.scores", "scores")
        .leftJoinAndSelect("maps.winner", "mapWinner")
        .leftJoinAndSelect("matchup.messages", "messages")
        .leftJoinAndSelect("messages.user", "user")
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID })
        .andWhere("referee.ID = :refereeID", { refereeID: ctx.state.user.ID })
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found.",
        };
        return;
    }

    ctx.body = {
        success: true,
        matchup,
    };
});

export default refereeMatchupsRouter;