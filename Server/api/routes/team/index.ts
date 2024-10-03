
import { GuildMember } from "discord.js";
import { QueryFailedError } from "typeorm";
import { CorsaceRouter } from "../../../corsaceRouter";
import { isCorsace, isLoggedInDiscord } from "../../../middleware";
import { Team } from "../../../../Models/tournaments/team";
import { Team as TeamInterface, TeamList, TeamMember, validateTeamText } from "../../../../Interfaces/team";
import { Tournament, TournamentStatus } from "../../../../Models/tournaments/tournament";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { discordClient } from "../../../discord";
import { validateTeam } from "../../../middleware/team";
import { parseQueryParam } from "../../../utils/query";
import { deleteTeamAvatar, uploadTeamAvatar } from "../../../functions/tournaments/teams/teamAvatarFunctions";
import { Matchup, preInviteTime } from "../../../../Models/tournaments/matchup";
import { cron } from "../../../cron";
import { CronJobType } from "../../../../Interfaces/cron";
import { parseDateOrTimestamp } from "../../../utils/dateParse";
import getTeamInvites from "../../../functions/get/getTeamInvites";
import { Stage } from "../../../../Models/tournaments/stage";
import { User } from "../../../../Models/user";
import { unallowedToPlay, TournamentRoleType } from "../../../../Interfaces/tournament";
import { publish } from "../../../functions/centrifugo";

const teamRouter = new CorsaceRouter();

teamRouter.$get<{ teams: TeamInterface[] }>("/", isLoggedInDiscord, async (ctx) => {
    const teamIDs: {
        ID: number;
    }[] = await Team
        .createQueryBuilder("team")
        .leftJoin("team.captain", "captain")
        .leftJoin("team.members", "member")
        .where("captain.discordUserID = :discordUserID", { discordUserID: ctx.state.user!.discord.userID })
        .orWhere("member.discordUserID = :discordUserID", { discordUserID: ctx.state.user!.discord.userID })
        .select("team.ID", "ID")
        .getRawMany();

    if (teamIDs.length === 0) {
        ctx.body = {
            success: true,
            teams: [],
        };
        return;
    }

    const teams = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.captain", "captain")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("team.tournaments", "tournament")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .where("team.ID IN (:...teamIDs)", { teamIDs: teamIDs.map(t => t.ID) })
        .getMany();

    ctx.body = {
        success: true,
        teams: await Promise.all(teams.map<Promise<TeamInterface>>(team => team.teamInterface(true, true))),
    };
});

teamRouter.$get<{ teams: TeamInterface[] }>("/all", async (ctx) => {
    const offset = parseInt(parseQueryParam(ctx.query.offset) ?? "") || 0;
    const limit = parseInt(parseQueryParam(ctx.query.limit) ?? "") || 0;
    const teamQ = Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.captain", "captain")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .leftJoinAndSelect("team.tournaments", "tournament");

    teamQ.skip(offset);
    if (limit)
        teamQ.take(limit);

    const teams = await teamQ.getMany();

    ctx.body = {
        success: true,
        teams: await Promise.all(teams.map<Promise<TeamInterface>>(team => team.teamInterface())),
    };
});

teamRouter.$get<{ team: TeamInterface }>("/:teamID", async (ctx) => {
    const team = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.captain", "captain")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .where("team.ID = :ID", { ID: ctx.params.teamID })
        .getOne();

    if (!team) {
        ctx.body = {
            success: false,
            error: "Team not found",
        };
        return;
    }

    ctx.body = {
        success: true,
        team: await team.teamInterface(true, true),
    };
});

teamRouter.$post<{
    team: TeamInterface;
    error?: string;
}>("/create", isLoggedInDiscord, async (ctx) => {
    const teamCount2Days = await Team
        .createQueryBuilder("team")
        .where("team.createdAt > :date", { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) })
        .andWhere("team.captainID = :captainID", { captainID: ctx.state.user!.ID })
        .getCount();

    if (teamCount2Days > 5) {
        ctx.body = {
            success: false,
            error: "You have created too many teams (5) in the last 2 days",
        };
        return;
    }

    let { name, abbreviation, timezoneOffset } = ctx.request.body;
    const isPlaying = ctx.request.body?.isPlaying;

    if (!name || !abbreviation || !timezoneOffset) {
        ctx.body = {
            success: false,
            error: "Missing parameters",
        };
        return;
    }

    if (typeof timezoneOffset !== "number") {
        timezoneOffset = parseInt(timezoneOffset);
        if (isNaN(timezoneOffset) || timezoneOffset < -12 || timezoneOffset > 14) {
            ctx.body = {
                success: false,
                error: "Invalid timezone",
            };
            return;
        }
    }

    const res = validateTeamText(name, abbreviation);
    if ("error" in res) {
        ctx.body = {
            success: false,
            error: res.error,
        };
        return;
    }

    name = res.name;
    abbreviation = res.abbreviation;

    const team = new Team();
    team.name = name;
    team.abbreviation = abbreviation;
    team.timezoneOffset = timezoneOffset;
    team.captain = ctx.state.user!;
    team.members = [];
    if (isPlaying)
        team.members = [ctx.state.user!];

    const noErr = await team.calculateStats();
    try {
        await team.save();
    } catch (e) {
        if (e instanceof QueryFailedError && e.driverError.sqlState === "45000")
            ctx.body = {
                success: false,
                error: "Team already exists, you may have double clicked",
            };
        else
            ctx.body = {
                success: false,
                error: `Error creating team\n${e}`,
            };
        return;
    }
    if (!noErr)
        ctx.body = {
            success: true,
            team: await team.teamInterface(false, false),
            error: "Team created, but there was an error calculating stats. Please contact VINXIS",
        };
    else
        ctx.body = {
            success: true,
            team: await team.teamInterface(true, true),
        };
});

teamRouter.$post<{ avatar: string }>("/:teamID/avatar", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team = ctx.state.team!;

    // Get the file from the request
    const files = ctx.request.files?.avatar;
    if (!files) {
        ctx.body = {
            success: false,
            error: "Missing avatar",
        };
        return;
    }

    // if files is an array, get the first
    const file = Array.isArray(files) ? files[0] : files;

    // Check if the file is an image and not a gif
    if (!file.mimetype?.startsWith("image/") || file.mimetype === "image/gif") {
        ctx.body = {
            success: false,
            error: "Invalid file type",
        };
        return;
    }

    try {
        await deleteTeamAvatar(team);
        const avatarPath = await uploadTeamAvatar(team, file.filepath);

        // Update the team
        team.avatarURL = avatarPath;
        await team.save();

        ctx.body = {
            success: true,
            avatar: avatarPath,
        };
    } catch (e) {
        ctx.body = {
            success: false,
            error: `Error saving avatar\n${e}`,
        };
    }
});

teamRouter.$post("/:teamID/register", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team = ctx.state.team!;

    const tournamentID = ctx.request.body?.tournamentID;
    if (!tournamentID || isNaN(parseInt(tournamentID))) {
        ctx.body = {
            success: false,
            error: "Missing tournament ID",
        };
        return;
    }

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "team")
        .innerJoinAndSelect("tournament.mode", "mode")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .getOne();

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }
    if (tournament.status !== TournamentStatus.Registrations) {
        ctx.body = {
            success: false,
            error: "Tournament is not in registration phase",
        };
        return;
    }

    if (tournament.teams.find(t => t.ID === team.ID)) {
        ctx.body = {
            success: false,
            error: "Team already registered",
        };
        return;
    }

    // Check if team member count is within the tournament's limits
    if (tournament.maxTeamSize < team.members.length) {
        ctx.body = {
            success: false,
            error: `Team has too many members (${team.members.length}). Maximum is ${tournament.maxTeamSize}`,
        };
        return;
    }

    if (tournament.minTeamSize > team.members.length) {
        ctx.body = {
            success: false,
            error: `Team has too few members (${team.members.length}). Minimum is ${tournament.minTeamSize}`,
        };
        return;
    }

    if (tournament.captainMustPlay && !team.members.some(m => m.ID === team.captain.ID)) {
        ctx.body = {
            success: false,
            error: "Team captain must play in this tournament and be a member of the team",
        };
        return;
    }

    const teamMembers = [team.captain, ...team.members].filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i);
    const alreadyRegistered = await User
        .createQueryBuilder("user")
        .innerJoin("user.teams", "team")
        .innerJoin("team.tournaments", "tournament")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .andWhere("user.ID IN (:...IDs)", { IDs: teamMembers.map(m => m.ID) })
        .getMany();
    if (alreadyRegistered.length > 0) {
        ctx.body = {
            success: false,
            error: `Some members are already registered in this tournament:\n${alreadyRegistered.map(m => m.osu.username).join(", ")}`,
        };
        return;
    }

    // Role checks
    const tournamentRoles = await TournamentRole
        .createQueryBuilder("tournamentRole")
        .innerJoin("tournamentRole.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .getMany();
    const participantRoles = tournamentRoles.filter(r => r.roleType === TournamentRoleType.Participants);
    const captainRoles = tournamentRoles.filter(r => r.roleType === TournamentRoleType.Captains);
    const unallowedRoles = tournamentRoles.filter(r => unallowedToPlay.includes(r.roleType));
    try {
        const tournamentServer = await discordClient.guilds.fetch(tournament.server);
        await tournamentServer.members.fetch();
        const discordMembers = teamMembers.map(m => tournamentServer.members.resolve(m.discord.userID));
        if (!discordMembers.some(m => team.captain.discord.userID === m?.id)) {
            ctx.body = {
                success: false,
                error: "Team captains are required to be in the discord server",
            };
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
                success: false,
                error: `Some members are staffing and are thus not allowed to play in this tournament:\n${memberStaff.map(m => m.displayName).join(", ")}}`,
            };
            return;
        }

        for (const discordMember of discordMembers) {
            if (!discordMember)
                continue;

            if (team.captain.discord.userID === discordMember.id)
                await discordMember.roles.add([...captainRoles.map(r => r.roleID), ...participantRoles.map(r => r.roleID)]);
            else
                await discordMember.roles.add(participantRoles.map(r => r.roleID));
        }
    } catch (e) {
        ctx.body = {
            success: false,
            error: `Error fetching tournament server. The bot may not be in the server anymore. Contact the tournament's organizers to readd the bot to the server.\n${e}`,
        };
        return;
    }

    const teamList: TeamList = {
        ID: team.ID,
        name: team.name,
        abbreviation: team.abbreviation,
        avatarURL: team.avatarURL,
        pp: team.pp,
        BWS: team.BWS,
        rank: team.rank,
        members: team.members.map<TeamMember>(m => ({
            ID: m.ID,
            username: m.osu.username,
            osuID: m.osu.userID,
            country: m.country,
            rank: m.userStatistics?.find(s => s.modeDivision.ID === tournament.mode.ID)?.rank ?? 0,
            isCaptain: m.ID === team.captain.ID,
        })),
    };

    const qualifierStage = await Stage
        .createQueryBuilder("stage")
        .innerJoin("stage.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .andWhere("stage.stageType = '0'")
        .getOne();
    if (qualifierStage) {
        const qualifierAt = ctx.request.body?.qualifierAt;
        if (!qualifierAt) {
            ctx.body = {
                success: false,
                error: "Missing qualifier date",
            };
            return;
        }

        const qualifierDate = parseDateOrTimestamp(qualifierAt);
        if (isNaN(qualifierDate.getTime())) {
            ctx.body = {
                success: false,
                error: "Invalid qualifier date",
            };
            return;
        }
        if (qualifierDate.getTime() < qualifierStage.timespan.start.getTime() || qualifierDate.getTime() > qualifierStage.timespan.end.getTime()) {
            ctx.body = {
                success: false,
                error: "Qualifier date is not within the qualifier stage",
            };
            return;
        }

        try {
            const matchup = new Matchup();
            matchup.date = qualifierDate;
            matchup.teams = [ team ];
            matchup.stage = qualifierStage;
            await matchup.save();
        } catch (e) {
            if (e instanceof QueryFailedError && e.driverError.sqlState === "45000")
                ctx.body = {
                    success: false,
                    error: "Team already has a qualifier matchup, you may have double clicked",
                };
            else
                ctx.body = {
                    success: false,
                    error: `Error creating qualifier matchup\n${e}`,
                };
            return;
        }

        try {
            await cron.add(CronJobType.QualifierMatchup, new Date(Math.max(qualifierDate.getTime() - preInviteTime, Date.now() + 10 * 1000)));
        } catch (e) {
            tournament.teams.push(team);
            await tournament.save();

            await team.calculateStats();
            await team.save();

            publish(`teams:${tournamentID}`, { type: "teamRegistered", team: teamList });
            ctx.body = {
                success: false,
                error: `Successfully registered team, but failed to schedule a timer to run qualifier matchup. Please contact VINXIS or ThePooN\n${e}`,
            };
            return;
        }
    }

    tournament.teams.push(team);
    await tournament.save();

    await team.calculateStats();
    await team.save();

    publish(`teams:${tournamentID}`, { type: "teamRegistered", team: teamList });
    ctx.body = { success: true };
});

teamRouter.$post("/:teamID/unregister", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team = ctx.state.team!;

    const tournamentID = ctx.request.body?.tournamentID;
    if (!tournamentID || isNaN(parseInt(tournamentID))) {
        ctx.body = {
            success: false,
            error: "Missing tournament ID",
        };
        return;
    }

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "team")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .getOne();

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }

    if (!tournament.teams.find(t => t.ID === team.ID)) {
        ctx.body = {
            success: false,
            error: "Team not registered",
        };
        return;
    }

    if (tournament.status !== TournamentStatus.Registrations) {
        ctx.body = {
            success: false,
            error: "Tournament is not in registration phase",
        };
        return;
    }

    const qualifierStage = await Stage
        .createQueryBuilder("stage")
        .innerJoin("stage.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .andWhere("stage.stageType = '0'")
        .getOne();
    if (qualifierStage) {
        const qualifier = await Matchup
            .createQueryBuilder("matchup")
            .innerJoin("matchup.stage", "stage")
            .innerJoin("matchup.teams", "team")
            .where("stage.ID = :stageID", { stageID: qualifierStage.ID })
            .andWhere("team.ID = :teamID", { teamID: team.ID })
            .getOne();
        if (!qualifier) {
            ctx.body = {
                success: false,
                error: "No qualifier found assigned to this team",
            };
            return;
        }

        if (qualifier.mp) {
            ctx.body = {
                success: false,
                error: "Team has already played a qualifier match",
            };
            return;
        }

        await qualifier.remove();
    }

    tournament.teams = tournament.teams.filter(t => t.ID !== team.ID);
    await tournament.save();

    ctx.body = { success: true };
});

teamRouter.$post("/:teamID/qualifier", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team = ctx.state.team!;

    const tournamentID = ctx.request.body?.tournamentID;
    if (!tournamentID || isNaN(parseInt(tournamentID))) {
        ctx.body = {
            success: false,
            error: "Missing tournament ID",
        };
        return;
    }

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .getOne();

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }

    if (tournament.status !== TournamentStatus.Registrations) {
        ctx.body = {
            success: false,
            error: "Tournament is not in registration phase",
        };
        return;
    }

    const teamRegistered = await Team
        .createQueryBuilder("team")
        .innerJoin("team.tournaments", "tournament")
        .where("team.ID = :ID", { ID: team.ID })
        .andWhere("tournament.ID = :tournamentID", { tournamentID })
        .getExists();
    if (!teamRegistered) {
        ctx.body = {
            success: false,
            error: "Team not registered",
        };
        return;
    }

    const qualifierStage = await Stage
        .createQueryBuilder("stage")
        .innerJoin("stage.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .andWhere("stage.stageType = '0'")
        .getOne();
    if (!qualifierStage) {
        ctx.body = {
            success: false,
            error: "Tournament does not have a qualifier stage",
        };
        return;
    }

    const qualifierAt = ctx.request.body?.qualifierAt;
    if (!qualifierAt) {
        ctx.body = {
            success: false,
            error: "Missing qualifier date",
        };
        return;
    }

    const qualifierDate = parseDateOrTimestamp(qualifierAt);
    if (isNaN(qualifierDate.getTime())) {
        ctx.body = {
            success: false,
            error: "Invalid qualifier date",
        };
        return;
    }

    if (qualifierDate.getTime() < qualifierStage.timespan.start.getTime() || qualifierDate.getTime() > qualifierStage.timespan.end.getTime()) {
        ctx.body = {
            success: false,
            error: "Qualifier date is not within the qualifier stage",
        };
        return;
    }

    const qualifier = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("matchup.teams", "team")
        .where("stage.ID = :stageID", { stageID: qualifierStage.ID })
        .andWhere("team.ID = :teamID", { teamID: team.ID })
        .getOne();
    if (!qualifier) {
        ctx.body = {
            success: false,
            error: "No qualifier found assigned to this team",
        };
        return;
    }

    if (qualifier.mp) {
        ctx.body = {
            success: false,
            error: "Team has already played a qualifier match",
        };
        return;
    }

    qualifier.date = qualifierDate;
    await qualifier.save();

    await cron.add(CronJobType.QualifierMatchup, new Date(Math.max(qualifierDate.getTime() - preInviteTime, Date.now() + 10 * 1000)));

    ctx.body = { success: true };
});

teamRouter.$post("/:teamID/captain", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team = ctx.state.team!;

    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .innerJoin("tournament.teams", "team")
        .where("team.ID = :ID", { ID: team.ID })
        .getMany();

    if (tournaments.some(t => t.status === TournamentStatus.Registrations)) {
        const qualifierMatches = await Matchup
            .createQueryBuilder("matchup")
            .innerJoin("matchup.stage", "stage")
            .innerJoin("stage.tournament", "tournament")
            .innerJoin("matchup.teams", "team")
            .where("tournament.ID IN (:...IDs)", { IDs: tournaments.filter(t => t.status === TournamentStatus.Registrations).map(t => t.ID) })
            .andWhere("stage.stageType = '0'")
            .andWhere("team.ID = :teamID", { teamID: team.ID })
            .getExists();

        if (qualifierMatches) {
            ctx.body = {
                success: false,
                error: "Team is currently registered in a tournament where they have already played a qualifier match",
            };
            return;
        }
    }

    if (tournaments.some(t => t.status !== TournamentStatus.Registrations && t.status !== TournamentStatus.NotStarted)) {
        ctx.body = {
            success: false,
            error: "Team cannot change lineup",
        };
        return;
    }

    if (team.members.some(m => m.ID === ctx.state.user!.ID)) {
        if (tournaments.some(t => team.members.length - 1 < t.minTeamSize)) {
            ctx.body = {
                success: false,
                error: "Team cannot have less than the minimum amount of players for the tournaments the team is in.",
            };
            return;
        }

        if (tournaments.some(t => t.captainMustPlay)) {
            ctx.body = {
                success: false,
                error: "Team is registered in a tournament where the captain must play.",
            };
            return;
        }

        team.members = team.members.filter(m => m.ID !== ctx.state.user!.ID);
        await team.calculateStats();
        await team.save();

        ctx.body = { success: true };
    } else {
        if (tournaments.some(t => team.members.length + 1 > t.maxTeamSize)) {
            ctx.body = {
                success: false,
                error: "Team cannot have more than the maximum amount of players for the tournaments the team is in.",
            };
            return;
        }

        team.members.push(ctx.state.user!);
        await team.calculateStats();
        await team.save();

        ctx.body = { success: true };
    }
});

teamRouter.$post("/:teamID/leave", isLoggedInDiscord, validateTeam(false), async (ctx) => {
    const user = ctx.state.user!;
    const team = ctx.state.team!;

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
            .where("tournament.ID IN (:...IDs)", { IDs: tournaments.filter(t => t.status === TournamentStatus.Registrations).map(t => t.ID) })
            .andWhere("stage.stageType = '0'")
            .andWhere("team.ID = :teamID", { teamID: team.ID })
            .getMany();

        if (qualifierMatches.length > 0) {
            ctx.body = {
                success: false,
                error: "Team is currently registered in a tournament where they have already played a qualifier match",
            };
            return;
        }
    }

    if (tournaments.some(t => t.status !== TournamentStatus.Registrations && t.status !== TournamentStatus.NotStarted)) {
        ctx.body = {
            success: false,
            error: "Team cannot change lineup",
        };
        return;
    }

    if (team.members.every(m => m.ID !== user.ID)) {
        ctx.body = {
            success: false,
            error: "User is not in the team",
        };
        return;
    }

    team.members = team.members.filter(m => m.ID !== user.ID);
    await team.calculateStats();
    await team.save();

    ctx.body = { success: true };
});

teamRouter.$post("/:teamID/captain/:userID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team = ctx.state.team!;

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
            .where("tournament.ID IN (:...IDs)", { IDs: tournaments.filter(t => t.status === TournamentStatus.Registrations).map(t => t.ID) })
            .andWhere("stage.stageType = '0'")
            .andWhere("team.ID = :teamID", { teamID: team.ID })
            .getMany();

        if (qualifierMatches.length > 0) {
            ctx.body = {
                success: false,
                error: "Team is currently registered in a tournament where they have already played a qualifier match",
            };
            return;
        }
    }

    if (tournaments.some(t => t.status !== TournamentStatus.Registrations && t.status !== TournamentStatus.NotStarted)) {
        ctx.body = {
            success: false,
            error: "Team cannot change lineup",
        };
        return;
    }

    const userID = parseInt(ctx.params.userID);
    if (isNaN(userID)) {
        ctx.body = {
            success: false,
            error: "Invalid user ID",
        };
        return;
    }

    if (team.captain.ID === userID) {
        ctx.body = {
            success: false,
            error: "User is already the captain",
        };
        return;
    }

    if (team.members.every(m => m.ID !== userID)) {
        ctx.body = {
            success: false,
            error: "User is not in the team",
        };
        return;
    }

    team.captain = team.members.find(m => m.ID === userID)!;

    if (!team.members.some(m => m.ID === ctx.state.user!.ID)) {
        team.members.push(ctx.state.user!);
        team.members = team.members.filter(m => m.ID !== userID);
    }

    await team.save();

    ctx.body = { success: true };
});

teamRouter.$post("/:teamID/remove/:userID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team = ctx.state.team!;

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
            .where("tournament.ID IN (:...IDs)", { IDs: tournaments.filter(t => t.status === TournamentStatus.Registrations).map(t => t.ID) })
            .andWhere("stage.stageType = '0'")
            .andWhere("team.ID = :teamID", { teamID: team.ID })
            .getMany();

        if (qualifierMatches.length > 0) {
            ctx.body = {
                success: false,
                error: "Team is currently registered in a tournament where they have already played a qualifier match",
            };
            return;
        }
    }

    if (tournaments.some(t => t.status !== TournamentStatus.Registrations && t.status !== TournamentStatus.NotStarted)) {
        ctx.body = {
            success: false,
            error: "Team cannot change lineup",
        };
        return;
    }

    const userID = parseInt(ctx.params.userID);
    if (isNaN(userID)) {
        ctx.body = {
            success: false,
            error: "Invalid user ID",
        };
        return;
    }

    if (team.members.every(m => m.ID !== userID)) {
        ctx.body = {
            success: false,
            error: "User is not in the team",
        };
        return;
    }

    team.members = team.members.filter(m => m.ID !== userID);
    await team.calculateStats();
    await team.save();

    ctx.body = { success: true };
});

teamRouter.$patch<{
    name: string;
    abbreviation: string;
}>("/:teamID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team = ctx.state.team!;
    const body: Partial<Team> | undefined = ctx.request.body;
    if (body?.timezoneOffset) {
        if (typeof body.timezoneOffset !== "number" || body.timezoneOffset < -12 || body.timezoneOffset > 14) {
            ctx.body = {
                success: false,
                error: "Invalid timezone",
            };
            return;
        }
        team.timezoneOffset = body.timezoneOffset;
    }
    if (
        (body?.name && body.name !== team.name) ||
        (body?.abbreviation && body.abbreviation !== team.abbreviation)
    ) {
        const tournaments = await Tournament
            .createQueryBuilder("tournament")
            .leftJoin("tournament.teams", "team")
            .where("team.ID = :ID", { ID: team.ID })
            .getMany();

        if (tournaments.some(t => t.status !== TournamentStatus.NotStarted)) {
            ctx.body = {
                success: false,
                error: "Team is currently playing/has played in a tournament",
            };
            return;
        }

        if (body?.name)
            team.name = body.name;
        if (body?.abbreviation)
            team.abbreviation = body.abbreviation;
    }

    const res = validateTeamText(team.name, team.abbreviation);
    if ("error" in res) {
        ctx.body = {
            success: false,
            error: res.error,
        };
        return;
    }

    team.name = res.name;
    team.abbreviation = res.abbreviation;

    await team.save();

    ctx.body = {
        success: true,
        name: team.name,
        abbreviation: team.abbreviation,
    };
});

teamRouter.$patch<{
    name: string;
    abbreviation: string;
}>("/:teamID/force", isLoggedInDiscord, isCorsace, async (ctx) => {
    const team = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.captain", "captain")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .where("team.ID = :ID", { ID: ctx.params.teamID })
        .getOne();

    if (!team) {
        ctx.body = {
            success: false,
            error: "Team not found",
        };
        return;
    }

    const body: (Partial<Team> & { deleteAvatar: boolean }) | undefined = ctx.request.body;

    if (body?.name)
        team.name = body.name;
    if (body?.abbreviation)
        team.abbreviation = body.abbreviation;
    if (body?.timezoneOffset) {
        if (typeof body.timezoneOffset !== "number" || body.timezoneOffset < -12 || body.timezoneOffset > 14) {
            ctx.body = {
                success: false,
                error: "Invalid timezone",
            };
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
        ctx.body = {
            success: false,
            error: res.error,
        };
        return;
    }

    team.name = res.name;
    team.abbreviation = res.abbreviation;

    await team.save();

    ctx.body = {
        success: true,
        name: team.name,
        abbreviation: team.abbreviation,
    };
});

teamRouter.$delete("/:teamID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team = ctx.state.team!;

    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .leftJoin("tournament.teams", "team")
        .where("team.ID = :ID", { ID: team.ID })
        .getMany();

    if (tournaments.some(t => t.status !== TournamentStatus.NotStarted)) {
        ctx.body = {
            success: false,
            error: "Team is currently playing/has played in a tournament",
        };
        return;
    }

    await deleteTeamAvatar(team);
    const invites = await getTeamInvites(team.ID, "teamID");
    await Promise.all(invites.map(i => i.remove()));

    await team.remove();

    ctx.body = { success: true };
});

export default teamRouter;
