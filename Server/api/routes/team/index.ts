import Router from "@koa/router";
import { isLoggedInDiscord } from "../../../middleware";
import { Team } from "../../../../Models/tournaments/team";
import { profanityFilterStrong } from "../../../../Interfaces/comment";
import { Tournament, TournamentStatus } from "../../../../Models/tournaments/tournament";
import { TournamentRole, unallowedToPlay } from "../../../../Models/tournaments/tournamentRole";
import { discordClient } from "../../../discord";
import { validateTeam } from "./middleware";
import { parseQueryParam } from "../../../utils/query";
import { uploadTeamAvatar } from "../../../functions/tournaments/teams/uploadTeamAvatar";

const teamRouter = new Router();

teamRouter.get("/", isLoggedInDiscord, async (ctx) => {
    const teams = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("team.manager", "manager")
        .where("manager.discordUserID = :discordUserID", { discordUserID: ctx.state.user.discord.userID })
        .orWhere("member.discordUserID = :discordUserID", { discordUserID: ctx.state.user.discord.userID })
        .getMany();
    
    ctx.body = teams.map(team => {
        return {
            ID: team.ID,
            name: team.name,
            abbreviation: team.abbreviation,
            manager: `${team.manager.osu.username} (${team.manager.osu.userID})`,
            members: team.members.map(member => `${member.osu.username} (${member.osu.userID})`),
        };
    });
});

teamRouter.get("/all", async (ctx) => {
    const teamQ = Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member");
    
    if (parseQueryParam(ctx.query.offset) && !isNaN(parseInt(parseQueryParam(ctx.query.offset)!)))
        teamQ.skip(parseInt(parseQueryParam(ctx.query.offset)!));
    if (parseQueryParam(ctx.query.limit) && !isNaN(parseInt(parseQueryParam(ctx.query.limit)!)))
        teamQ.take(parseInt(parseQueryParam(ctx.query.limit)!));

    const teams = await teamQ.getMany();

    ctx.body = teams.map(team => {
        return {
            ID: team.ID,
            name: team.name,
            abbreviation: team.abbreviation,
            manager: `${team.manager.osu.username} (${team.manager.osu.userID})`,
            members: team.members.map(member => `${member.osu.username} (${member.osu.userID})`),
        };
    });
});

teamRouter.post("/create", isLoggedInDiscord, async (ctx) => {
    let { name, abbreviation } = ctx.request.body;
    const isPlaying = ctx.request.body?.isPlaying;

    if (!name || !abbreviation) {
        ctx.body = { error: "Missing parameters" };
        return;
    }

    if (/^team /i.test(name)) {
        name = name.replace(/^team /i, "");
        if (/^t/i.test(abbreviation))
            abbreviation = abbreviation.replace(/^t/i, "");
    }

    if (name.length > 20 || name.length < 5 || profanityFilterStrong.test(name)) {
        ctx.body = { error: "Invalid name" };
        return;
    }

    if (abbreviation.length > 4 || abbreviation.length < 2 || profanityFilterStrong.test(abbreviation)) {
        ctx.body = { error: "Invalid abbreviation" };
        return;
    }

    const team = new Team;
    team.name = name;
    team.abbreviation = abbreviation;
    team.manager = ctx.state.user;
    team.members = [];
    if (isPlaying)
        team.members = [ctx.state.user];

    const err = await team.calculateStats();
    await team.save();
    if (!err)
        ctx.body = { success: "Team created, but there was an error calculating stats. Please contact VINXIS", team, error: !err };
    else
        ctx.body = { success: "Team created", team, error: !err };
});

teamRouter.post("/:teamID/avatar", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    // Get the file from the request
    const files = ctx.request.files?.avatar;
    if (!files) {
        ctx.body = { error: "Missing avatar" };
        return;
    }
    
    // if files is an array, get the first 
    const file = Array.isArray(files) ? files[0] : files;
    
    // Check if the file is an image
    if (!file.mimetype?.startsWith("image/")) {
        ctx.body = { error: "Invalid file type" };
        return;
    }

    try {
        const avatarPath = await uploadTeamAvatar(team, file.filepath);
        
        // Update the team
        team.avatarURL = avatarPath;
        await team.save();

        ctx.body = { success: "Avatar updated", avatar: avatarPath };
    } catch (e) {
        ctx.body = { error: `Error saving avatar\n${e}` };
    }
});

teamRouter.post("/:teamID/register", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    const tournamentID = ctx.request.body?.tournamentID;
    if (!tournamentID) {
        ctx.body = { error: "Missing tournament ID" };
        return;
    }

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .getOne();
    
    if (!tournament) {
        ctx.body = { error: "Tournament not found" };
        return;
    }

    if (tournament.status !== TournamentStatus.Registrations) {
        ctx.body = { error: "Tournament is not in registration phase" };
        return;
    }

    if (tournament.teams.find(t => t.ID === team.ID)) {
        ctx.body = { error: "Team already registered" };
        return;
    }

    const tournamentMembers = tournament.teams.flatMap(t => [t.manager,...t.members]);
    const teamMembers = [team.manager, ...team.members];

    const tournamentRoles = await TournamentRole
        .createQueryBuilder("tournamentRole")
        .leftJoin("tournamentRole.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .getMany();
    const unallowedRoles = tournamentRoles.filter(r => unallowedToPlay.includes(r.roleType));
    for (const member of teamMembers) {
        const tournamentServer = await discordClient.guilds.fetch(tournament.server);
        const discordMember = await tournamentServer.members.fetch(member.discord.userID);
        if (discordMember.roles.cache.some(r => unallowedRoles.some(tr => tr.roleID === r.id))) {
            ctx.body = { error: `Member ${member.osu.username} is already registered in this tournament` };
            return;
        }
    }

    const alreadyRegistered = teamMembers.filter(member => tournamentMembers.some(m => m.ID === member.ID));
    if (alreadyRegistered.length > 0) {
        ctx.body = { error: `Some members are already registered in this tournament`, members: alreadyRegistered.map(m => m.osu.username) };
        return;
    }

    tournament.teams.push(team);
    await tournament.save();
    
    await team.calculateStats();
    await team.save();

    ctx.body = { success: "Team registered" };
});

teamRouter.post("/:teamID/remove/:userID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .leftJoin("tournament.teams", "team")
        .where("team.ID = :ID", { ID: team.ID })
        .getMany();

    if (tournaments.some(t => t.status === TournamentStatus.Ongoing)) {
        ctx.body = { error: "Team is already playing in a tournament" };
        return;
    }

    const userID = parseInt(ctx.params.userID);
    if (isNaN(userID)) {
        ctx.body = { error: "Invalid user ID" };
        return;
    }

    if (team.members.every(m => m.ID !== userID)) {
        ctx.body = { error: "User is not in the team" };
        return;
    }

    team.members = team.members.filter(m => m.ID !== userID);
    await team.calculateStats();
    await team.save();
    

    ctx.body = { success: "User removed from the team" };
});

teamRouter.patch("/:teamID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;
    const body: Partial<Team> | undefined = ctx.request.body;

    if (body?.name)
        team.name = body.name;
    if (body?.abbreviation)
        team.abbreviation = body.abbreviation;
    
    await team.save();

    ctx.body = { success: "Team updated", name: team.name, abbreviation: team.abbreviation };
});
          
teamRouter.delete("/:teamID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    await ctx.state.team.remove();

    ctx.body = { success: "Team deleted" };
});

export default teamRouter;