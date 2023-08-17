import Router from "@koa/router";
import { TournamentRoleType, unallowedToPlay } from "../../../../Interfaces/tournament";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { discordClient } from "../../../discord";
import { isLoggedInDiscord } from "../../../middleware";
import { hasRoles, validateTournament } from "../../../middleware/tournament";

// TODO: Delete these after testing
import { Stage } from "../../../../Models/tournaments/stage";
import { Team } from "../../../../Models/tournaments/team";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { OAuth, User } from "../../../../Models/user";

const refereeMatchupsRouter = new Router();

//TODO: Look into making refereeRouter.use work for the middleware functions

refereeMatchupsRouter.get("/:tournamentID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchupQ = Matchup
        .createQueryBuilder("matchup")
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
        .leftJoin("matchup.referee", "referee")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID });

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
        
    const matchups = await matchupQ.getMany();

    ctx.body = {
        success: true,
        matchups,
    };
});

refereeMatchupsRouter.get("/:tournamentID/:matchupID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchupQ = Matchup
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
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID });

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
        
    const matchup = await matchupQ.getOne();

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

// TODO: Delete thius shitr when PR is ready
refereeMatchupsRouter.post("/testMatchup/:tournamentID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .getOne();
    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found.",
        };
        return;
    }

    const users = [
        { country: "US", osu: { username: "Risen", userID: "9652892" }, discord: { username: "zzzrisen", userID: "152971654379732992" } },
        { country: "GB", osu: { username: "ilw8", userID: "14167692" }, discord: { username: "ilw8", userID: "181358896328212480" } },
    ];

    const teams: Team[] = [];
    for (const u of users) {
        let user = await User.findOne({ where: { osu: { userID: u.osu.userID } } });
        if (user) {
            user.discord = user.discord as OAuth;
            await user.save();
        } else {
            user = new User();
            user.country = u.country;
            user.osu = u.osu as OAuth;
            user.discord = u.discord as OAuth;
            await user.save();
        }
        console.log(`Saved ${u.discord.username} to database.`);

        const team = new Team();
        team.name = user.osu.username;
        team.manager = user;
        team.members = [ user ];
        team.avatarURL = user.osu.avatar;
        team.tournaments = [tournament];
        const usernameSplit = user.osu.username.split(" ");
        team.abbreviation = usernameSplit.length < 2 || usernameSplit.length > 4 ? 
            usernameSplit[0].slice(0, Math.min(usernameSplit[0].length, 4)) : 
            usernameSplit.map(n => n[0]).join("");
        await team.calculateStats();
        await team.save();
        console.log(`Saved ${team.name} to database.`);
        teams.push(team);
    }

    const stage = await Stage
        .createQueryBuilder("stage")
        .innerJoin("stage.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .andWhere("stage.stageType != '0'")
        .getOne();

    const matchup = new Matchup();
    matchup.stage = stage;
    matchup.team1 = teams[0];
    matchup.team2 = teams[1];
    matchup.date = new Date();
    await matchup.save();

    ctx.body = {
        success: true,
        teams,
        matchup,
    };
});

export default refereeMatchupsRouter;