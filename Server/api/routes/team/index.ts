import Router from "@koa/router";
import { isCorsace, isLoggedInDiscord } from "../../../middleware";
import { Team } from "../../../../Models/tournaments/team";
import { Team as TeamInterface, validateTeamText } from "../../../../Interfaces/team";
import { Tournament, TournamentStatus } from "../../../../Models/tournaments/tournament";
import { TournamentRole, unallowedToPlay, TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { discordClient } from "../../../discord";
import { validateTeam } from "./middleware";
import { parseQueryParam } from "../../../utils/query";
import { deleteTeamAvatar, uploadTeamAvatar } from "../../../functions/tournaments/teams/teamAvatarFunctions";
import { StageType } from "../../../../Interfaces/stage";
import { Matchup, preInviteTime } from "../../../../Models/tournaments/matchup";
import { cron } from "../../../cron";
import { CronJobType } from "../../../../Interfaces/cron";
import { parseDateOrTimestamp } from "../../../utils/dateParse";
import getTeamInvites from "../../../functions/get/getTeamInvites";
import { GuildMember } from "discord.js";

const teamRouter = new Router();

teamRouter.get("/", isLoggedInDiscord, async (ctx) => {
    const teamIDs = await Team
        .createQueryBuilder("team")
        .leftJoin("team.manager", "manager")
        .leftJoin("team.members", "member")
        .where("manager.discordUserID = :discordUserID", { discordUserID: ctx.state.user.discord.userID })
        .orWhere("member.discordUserID = :discordUserID", { discordUserID: ctx.state.user.discord.userID })
        .select("team.ID", "ID")
        .getRawMany();

    if (teamIDs.length === 0) {
        ctx.body = [];
        return;
    }

    const teams = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .where("team.ID IN (:...teamIDs)", { teamIDs: teamIDs.map(t => t.ID) })
        .getMany();

    ctx.body = await Promise.all(teams.map<Promise<TeamInterface>>(team => team.teamInterface()));
});

teamRouter.get("/all", async (ctx) => {
    const teamQ = Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode");

    if (parseQueryParam(ctx.query.offset) && !isNaN(parseInt(parseQueryParam(ctx.query.offset)!)))
        teamQ.skip(parseInt(parseQueryParam(ctx.query.offset)!));
    if (parseQueryParam(ctx.query.limit) && !isNaN(parseInt(parseQueryParam(ctx.query.limit)!)))
        teamQ.take(parseInt(parseQueryParam(ctx.query.limit)!));

    const teams = await teamQ.getMany();

    ctx.body = await Promise.all(teams.map<Promise<TeamInterface>>(team => team.teamInterface()));
});

teamRouter.get("/:teamID", async (ctx) => {
    const team = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .where("team.ID = :ID", { ID: ctx.params.teamID })
        .getOne();

    if (!team) {
        ctx.body = { error: "Team not found" };
        return;
    }

    ctx.body = await team.teamInterface();
});

teamRouter.post("/create", isLoggedInDiscord, async (ctx) => {
    let { name, abbreviation, timezoneOffset } = ctx.request.body;
    const isPlaying = ctx.request.body?.isPlaying;

    if (!name || !abbreviation || !timezoneOffset) {
        ctx.body = { error: "Missing parameters" };
        return;
    }

    if (typeof timezoneOffset !== "number") {
        timezoneOffset = parseInt(timezoneOffset);
        if (isNaN(timezoneOffset) || timezoneOffset < -12 || timezoneOffset > 14) {
            ctx.body = { error: "Invalid timezone" };
            return;
        }
    }

    const res = validateTeamText(name, abbreviation);
    if ("error" in res) {
        ctx.body = res;
        return;
    }

    name = res.name;
    abbreviation = res.abbreviation;

    const team = new Team;
    team.name = name;
    team.abbreviation = abbreviation;
    team.timezoneOffset = timezoneOffset;
    team.manager = ctx.state.user;
    team.members = [];
    if (isPlaying)
        team.members = [ctx.state.user];

    const noErr = await team.calculateStats();
    await team.save();
    if (!noErr)
        ctx.body = { success: "Team created, but there was an error calculating stats. Please contact VINXIS", team, error: !noErr };
    else
        ctx.body = { success: "Team created", team, error: !noErr };
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

    // Check if the file is an image and not a gif
    if (!file.mimetype?.startsWith("image/") || file.mimetype === "image/gif") {
        ctx.body = { error: "Invalid file type" };
        return;
    }

    try {
        await deleteTeamAvatar(team);
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
        .leftJoinAndSelect("tournament.stages", "stage")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .leftJoinAndSelect("stage.matchups", "matchup")
        .leftJoinAndSelect("matchup.teams", "matchupTeam")
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

    // Check if team member count is within the tournament's limits
    if (tournament.maxTeamSize < team.members.length) {
        ctx.body = { error: `Team has too many members (${team.members.length}). Maximum is ${tournament.maxTeamSize}` };
        return;
    }

    if (tournament.minTeamSize > team.members.length) {
        ctx.body = { error: `Team has too few members (${team.members.length}). Minimum is ${tournament.minTeamSize}` };
        return;
    }

    // Role checks
    const teamMembers = [team.manager, ...team.members].filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i);

    const tournamentRoles = await TournamentRole
        .createQueryBuilder("tournamentRole")
        .leftJoin("tournamentRole.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .getMany();
    const participantRoles = tournamentRoles.filter(r => r.roleType === TournamentRoleType.Participants);
    const managerRoles = tournamentRoles.filter(r => r.roleType === TournamentRoleType.Managers);
    const unallowedRoles = tournamentRoles.filter(r => unallowedToPlay.includes(r.roleType));
    try {
        const tournamentServer = await discordClient.guilds.fetch(tournament.server);
        await tournamentServer.members.fetch();
        const discordMembers = teamMembers.map(m => tournamentServer.members.resolve(m.discord.userID));
        if (!discordMembers.some(m => team.manager.discord.userID === m?.id)) {
            ctx.body = { error: "Team managers are required to be in the discord server" };
            return;
        }

        const memberStaff: GuildMember[] = [];
        for (const discordMember of discordMembers) {
            if (!discordMember)
                continue;
            if (discordMember.roles.cache.some(r => unallowedRoles.some(tr => tr.roleID === r.id)))
                memberStaff.push(discordMember);
        }
        if (memberStaff.length > 0) {
            ctx.body = { 
                error: `Some members are staffing and are thus not allowed to play in this tournament:\n${memberStaff.map(m => m.displayName).join(", ")}}`,
            };
            return;
        }

        for (const discordMember of discordMembers) {
            if (!discordMember)
                continue;

            if (team.manager.discord.userID === discordMember.id)
                await discordMember.roles.add([...managerRoles.map(r => r.roleID), ...participantRoles.map(r => r.roleID)]);
            else
                await discordMember.roles.add(participantRoles.map(r => r.roleID));
        }
    } catch (e) {
        ctx.body = { error: `Error fetching tournament server. The bot may not be in the server anymore. Contact the tournament's organizers to readd the bot to the server.\n${e}` };
        return;
    }

    const tournamentMembers = tournament.teams.flatMap(t => [t.manager, ...t.members]);
    const alreadyRegistered = teamMembers.filter(member => tournamentMembers.some(m => m.ID === member.ID));
    if (alreadyRegistered.length > 0) {
        ctx.body = { error: `Some members are already registered in this tournament:\n${alreadyRegistered.map(m => m.osu.username).join(", ")}` };
        return;
    }

    const qualifierStage = tournament.stages.find(s => s.stageType === StageType.Qualifiers);
    if (qualifierStage) {
        const qualifierAt = ctx.request.body?.qualifierAt;
        if (!qualifierAt) {
            ctx.body = { error: "Missing qualifier date" };
            return;
        }

        const qualifierDate = parseDateOrTimestamp(qualifierAt);
        if (isNaN(qualifierDate.getTime())) {
            ctx.body = { error: "Invalid qualifier date" };
            return;
        }
        if (qualifierDate.getTime() < qualifierStage.timespan.start.getTime() || qualifierDate.getTime() > qualifierStage.timespan.end.getTime()) {
            ctx.body = { error: "Qualifier date is not within the qualifier stage" };
            return;
        }

        const maxTeams = Math.floor(16 / tournament.matchupSize);
        const existingMatchup = qualifierStage.matchups.find(m => m.teams!.length < maxTeams && m.date.getTime() === qualifierDate.getTime());
        if (existingMatchup && !qualifierStage.qualifierTeamChooseOrder) {
            existingMatchup.teams!.push(team);
            await existingMatchup.save();
        } else {
            const matchup = new Matchup;
            matchup.date = qualifierDate;
            matchup.teams = [team];
            await matchup.save();

            qualifierStage.matchups.push(matchup);
            await qualifierStage.save();

            await cron.add(CronJobType.QualifierMatchup, new Date(Math.max(qualifierDate.getTime() - preInviteTime, Date.now() + 10 * 1000)));
        }
    }

    tournament.teams.push(team);
    await tournament.save();

    await team.calculateStats();
    await team.save();

    ctx.body = { success: "Team registered" };
});

teamRouter.post("/:teamID/qualifier", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    const tournamentID = ctx.request.body?.tournamentID;
    if (!tournamentID) {
        ctx.body = { error: "Missing tournament ID" };
        return;
    }

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "team")
        .leftJoinAndSelect("tournament.stages", "stage")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .leftJoinAndSelect("stage.matchups", "matchup")
        .leftJoinAndSelect("matchup.teams", "matchupTeam")
        .leftJoinAndSelect("matchup.maps", "map")
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

    if (!tournament.teams.find(t => t.ID === team.ID)) {
        ctx.body = { error: "Team not registered" };
        return;
    }

    const qualifierStage = tournament.stages.find(s => s.stageType === StageType.Qualifiers);
    if (!qualifierStage) {
        ctx.body = { error: "Tournament does not have a qualifier stage" };
        return;
    }

    const qualifierAt = ctx.request.body?.qualifierAt;
    if (!qualifierAt) {
        ctx.body = { error: "Missing qualifier date" };
        return;
    }

    const qualifierDate = parseDateOrTimestamp(qualifierAt);
    if (isNaN(qualifierDate.getTime())) {
        ctx.body = { error: "Invalid qualifier date" };
        return;
    }

    if (qualifierDate.getTime() < qualifierStage.timespan.start.getTime() || qualifierDate.getTime() > qualifierStage.timespan.end.getTime()) {
        ctx.body = { error: "Qualifier date is not within the qualifier stage" };
        return;
    }

    const previousMatch = qualifierStage.matchups.find(m => m.teams!.some(t => t.ID === team.ID));
    if (previousMatch) {
        if (previousMatch.mp) {
            ctx.body = { error: "Team has already played a qualifier match" };
            return;
        }

        previousMatch.teams = previousMatch.teams!.filter(t => t.ID !== team.ID);
        if (previousMatch.teams.length === 0)
            await previousMatch.remove();   
        else
            await previousMatch.save(); 
    } 

    const maxTeams = Math.floor(16 / tournament.matchupSize);
    const existingMatchup = qualifierStage.matchups.find(m => m.teams!.length < maxTeams && m.date.getTime() === qualifierDate.getTime());
    if (existingMatchup && !qualifierStage.qualifierTeamChooseOrder) {
        existingMatchup.teams!.push(team);
        await existingMatchup.save();
    } else {
        const matchup = new Matchup;
        matchup.date = qualifierDate;
        matchup.teams = [team];
        await matchup.save();
        
        qualifierStage.matchups.push(matchup);
        await qualifierStage.save();

        await cron.add(CronJobType.QualifierMatchup, new Date(Math.max(qualifierDate.getTime() - preInviteTime, Date.now() + 10 * 1000)));
    }

    ctx.body = { success: "Qualifier date set" };
});

teamRouter.post("/:teamID/manager", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .leftJoin("tournament.teams", "team")
        .where("team.ID = :ID", { ID: team.ID })
        .getMany();

    if (tournaments.some(t => t.status === TournamentStatus.Registrations)) {
        const qualifierMatches = await Matchup
            .createQueryBuilder("matchup")
            .innerJoin("matchup.stage", "stage")
            .innerJoin("stage.tournament", "tournament")
            .innerJoin("matchup.teams", "team")
            .where("tournament.ID = :ID", { ID: tournaments.filter(t => t.status === TournamentStatus.Registrations)[0].ID })
            .andWhere("stage.stageType = '0'")
            .andWhere("team.ID = :teamID", { teamID: team.ID })
            .getMany();

        if (qualifierMatches.length > 0) {
            ctx.body = { error: "Team is currently registered in a tournament where they have already played a qualifier match" };
            return;
        }
    }

    if (tournaments.some(t => t.status !== TournamentStatus.Registrations && t.status !== TournamentStatus.NotStarted)) {
        ctx.body = { error: "Team cannot change lineup" };
        return;
    }

    if (team.members.some(m => m.ID === ctx.state.user.ID)) {
        if (tournaments.some(t => team.members.length - 1 < t.minTeamSize)) {
            ctx.body = { error: "Team cannot have less than the minimum amount of players for the tournaments the team is in." };
            return;
        }

        team.members = team.members.filter(m => m.ID !== ctx.state.user.ID);
        await team.calculateStats();
        await team.save();

        ctx.body = { success: "Manager removed from the team" };
    } else {
        if (tournaments.some(t => team.members.length + 1 > t.maxTeamSize)) {
            ctx.body = { error: "Team cannot have more than the maximum amount of players for the tournaments the team is in." };
            return;
        }

        team.members.push(ctx.state.user);
        await team.calculateStats();
        await team.save();

        ctx.body = { success: "Manager added to the team" };
    }
});

teamRouter.post("/:teamID/manager/:userID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .leftJoin("tournament.teams", "team")
        .where("team.ID = :ID", { ID: team.ID })
        .getMany();

    if (tournaments.some(t => t.status === TournamentStatus.Registrations)) {
        const qualifierMatches = await Matchup
            .createQueryBuilder("matchup")
            .innerJoin("matchup.stage", "stage")
            .innerJoin("stage.tournament", "tournament")
            .innerJoin("matchup.teams", "team")
            .where("tournament.ID = :ID", { ID: tournaments.filter(t => t.status === TournamentStatus.Registrations)[0].ID })
            .andWhere("stage.stageType = '0'")
            .andWhere("team.ID = :teamID", { teamID: team.ID })
            .getMany();

        if (qualifierMatches.length > 0) {
            ctx.body = { error: "Team is currently registered in a tournament where they have already played a qualifier match" };
            return;
        }
    }

    if (tournaments.some(t => t.status !== TournamentStatus.Registrations && t.status !== TournamentStatus.NotStarted)) {
        ctx.body = { error: "Team cannot change lineup" };
        return;
    }

    const userID = parseInt(ctx.params.userID);
    if (isNaN(userID)) {
        ctx.body = { error: "Invalid user ID" };
        return;
    }

    if (team.manager.ID === userID) {
        ctx.body = { error: "User is already the manager" };
        return;
    }

    if (team.members.every(m => m.ID !== userID)) {
        ctx.body = { error: "User is not in the team" };
        return;
    }

    team.manager = team.members.find(m => m.ID === userID)!;

    if (!team.members.some(m => m.ID === ctx.state.user.ID)) {
        team.members.push(ctx.state.user);
        team.members = team.members.filter(m => m.ID !== userID);
    }
    
    await team.save();

    ctx.body = { success: "Manager changed" };
});

teamRouter.post("/:teamID/remove/:userID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .leftJoin("tournament.teams", "team")
        .where("team.ID = :ID", { ID: team.ID })
        .getMany();

    if (tournaments.some(t => t.status === TournamentStatus.Registrations)) {
        const qualifierMatches = await Matchup
            .createQueryBuilder("matchup")
            .innerJoin("matchup.stage", "stage")
            .innerJoin("stage.tournament", "tournament")
            .innerJoin("matchup.teams", "team")
            .where("tournament.ID = :ID", { ID: tournaments.filter(t => t.status === TournamentStatus.Registrations)[0].ID })
            .andWhere("stage.stageType = '0'")
            .andWhere("team.ID = :teamID", { teamID: team.ID })
            .getMany();

        if (qualifierMatches.length > 0) {
            ctx.body = { error: "Team is currently registered in a tournament where they have already played a qualifier match" };
            return;
        }
    }

    if (tournaments.some(t => t.status !== TournamentStatus.Registrations && t.status !== TournamentStatus.NotStarted)) {
        ctx.body = { error: "Team cannot change lineup" };
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

    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .leftJoin("tournament.teams", "team")
        .where("team.ID = :ID", { ID: ctx.state.team.ID })
        .getMany();

    if (tournaments.some(t => t.status !== TournamentStatus.NotStarted)) {
        ctx.body = { error: "Team is currently playing/has played in a tournament" };
        return;
    }

    if (body?.name)
        team.name = body.name;
    if (body?.abbreviation)
        team.abbreviation = body.abbreviation;
    if (body?.timezoneOffset) {
        if (typeof body.timezoneOffset !== "number" || body.timezoneOffset < -12 || body.timezoneOffset > 14) {
            ctx.body = { error: "Invalid timezone" };
            return;
        }
        team.timezoneOffset = body.timezoneOffset;
    }

    const res = validateTeamText(team.name, team.abbreviation);
    if ("error" in res) {
        ctx.body = res;
        return;
    }

    team.name = res.name;
    team.abbreviation = res.abbreviation;

    await team.save();

    ctx.body = { success: "Team updated", name: team.name, abbreviation: team.abbreviation };
});

teamRouter.patch("/:teamID/force", isLoggedInDiscord, isCorsace, async (ctx) => {
    const team = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .where("team.ID = :ID", { ID: ctx.params.teamID })
        .getOne();

    if (!team) {
        ctx.body = { error: "Team not found" };
        return;
    }

    const body: (Partial<Team> & { deleteAvatar: boolean }) | undefined = ctx.request.body;

    if (body?.name)
        team.name = body.name;
    if (body?.abbreviation)
        team.abbreviation = body.abbreviation;
    if (body?.timezoneOffset) {
        if (typeof body.timezoneOffset !== "number" || body.timezoneOffset < -12 || body.timezoneOffset > 14) {
            ctx.body = { error: "Invalid timezone" };
            return;
        }
        team.timezoneOffset = body.timezoneOffset;
    }
    if (body?.deleteAvatar) {
        await deleteTeamAvatar(team);
        team.avatarURL = null;
    }

    const res = validateTeamText(team.name, team.abbreviation);
    if ("error" in res) {
        ctx.body = res;
        return;
    }

    team.name = res.name;
    team.abbreviation = res.abbreviation;

    await team.save();

    ctx.body = { success: "Team updated", name: team.name, abbreviation: team.abbreviation };
});

teamRouter.delete("/:teamID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .leftJoin("tournament.teams", "team")
        .where("team.ID = :ID", { ID: ctx.state.team.ID })
        .getMany();

    if (tournaments.some(t => t.status !== TournamentStatus.NotStarted)) {
        ctx.body = { error: "Team is currently playing/has played in a tournament" };
        return;
    }

    const team: Team = ctx.state.team;
    await deleteTeamAvatar(team);
    const invites = await getTeamInvites(team.ID, "teamID");
    await Promise.all(invites.map(i => i.remove()));

    await ctx.state.team.remove();

    ctx.body = { success: "Team deleted" };
});

export default teamRouter;
