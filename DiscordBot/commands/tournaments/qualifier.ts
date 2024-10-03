import { ChatInputCommandInteraction, GuildMember, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import { Team } from "../../../Models/tournaments/team";
import { TournamentRole } from "../../../Models/tournaments/tournamentRole";
import { User } from "../../../Models/user";
import getFromList from "../../functions/getFromList";
import getTeams from "../../../Server/functions/get/getTeams";
import getTournament from "../../functions/tournamentFunctions/getTournament";
import getUser from "../../../Server/functions/get/getUser";
import channelID from "../../functions/channelID";
import commandUser from "../../functions/commandUser";
import { loginResponse } from "../../functions/loginResponse";
import { extractDate, extractTargetText } from "../../functions/tournamentFunctions/paramaterExtractionFunctions";
import { securityChecks } from "../../functions/tournamentFunctions/securityChecks";
import { discordStringTimestamp } from "../../../Server/utils/dateParse";
import { extractParameters } from "../../functions/parameterFunctions";
import respond from "../../functions/respond";
import confirmCommand from "../../functions/confirmCommand";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";
import { Matchup, preInviteTime } from "../../../Models/tournaments/matchup";
import { StageType } from "../../../Interfaces/stage";
import { cron } from "../../../Server/cron";
import { CronJobType } from "../../../Interfaces/cron";
import { discordClient } from "../../../Server/discord";
import { MatchupMessage } from "../../../Models/tournaments/matchupMessage";
import { TournamentRoleType, unallowedToPlay } from "../../../Interfaces/tournament";
import { MatchupSet } from "../../../Models/tournaments/matchupSet";

// TODO: Merge the functionality in this command with the team create and register and qualifier API endpoints
async function singlePlayerTournamentTeamCreation (m: Message | ChatInputCommandInteraction, user: User, tournament: Tournament) {
    if (tournament.minTeamSize !== 1) {
        await respond(m, `User ${user.osu.username} is not in this tournament or is not a team captain`);
        return;
    }

    if (!await confirmCommand(m, `User ${user.osu.username} is not in this tournament. Do you want to register them?`)) {
        await respond(m, "Ok Lol . stopped signing player for qualifier");
        return;
    }

    const team = new Team();
    team.name = user.osu.username;
    team.captain = user;
    team.members = [ user ];
    team.avatarURL = user.osu.avatar;
    team.tournaments = [];

    const usernameSplit = user.osu.username.split(" ");
    team.abbreviation = usernameSplit.length < 2 || usernameSplit.length > 4 ?
        usernameSplit[0].slice(0, Math.min(usernameSplit[0].length, 4)) :
        usernameSplit.map(n => n[0]).join("");

    return team;
}

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const params = await extractParameters<parameters>(m, [
        { name: "date", paramType: "string", customHandler: extractDate },
        { name: "target", paramType: "string", customHandler: extractTargetText, optional: true },
        { name: "tournament", paramType: "string", optional: true },
    ]);
    if (!params)
        return;

    const { date, target, tournament: tournamentParam } = params;

    if (isNaN(date.getTime())) {
        await respond(m, "Invalid date. Provide a valid date using either `YYYY-MM-DD HH:MM UTC` format, or a unix/epoch timestamp in seconds.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/)");
        return;
    }

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel", [TournamentStatus.NotStarted, TournamentStatus.Registrations], true);
    if (!tournament)
        return;

    const stages = tournament.stages.filter(s => s.stageType === StageType.Qualifiers);
    if (stages.length === 0) {
        await respond(m, `\`${tournament.name}\` does not have a qualifiers stage`);
        return;
    }
    if (stages.length > 1) {
        await respond(m, `There are multiple qualifiers stages for \`${tournament.name}\` which SHOULD NEVER HAPPEN CONTACT VINXIS`);
        return;
    }
    const stage = stages[0];

    if (stage.timespan.start.getTime() > date.getTime() || stage.timespan.end.getTime() < date.getTime()) {
        await respond(m, `The qualifier date must be between ${discordStringTimestamp(stage.timespan.start)} and ${discordStringTimestamp(stage.timespan.end)}`);
        return;
    }

    let user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }
    let team: Team | null | undefined = undefined;

    if (target) {
        if (!await securityChecks(m, true, true, [], [TournamentRoleType.Organizer]))
            return;

        const teams = await getTeams(target, "name", false, true);
        if (teams.length > 0) {
            team = await getFromList(m, teams, "team", target);
            if (!team) {
                await respond(m, `Can't find team \`${target}\``);
                return;
            }
        }

        // Target may be user
        if (teams.length === 0) {
            const users = await User
                .createQueryBuilder("user")
                .leftJoinAndSelect("user.otherNames", "otherName")
                .where("user.osuUserid = :user")
                .orWhere("user.osuUsername LIKE :user")
                .orWhere("otherName.name LIKE :user")
                .setParameter("user", `%${target}%`)
                .getMany();
            const userList = await getFromList(m, users.map(u => ({ ID: u.ID, name: u.osu.username })), "user", target);
            if (!userList) {
                await respond(m, `Can't find user \`${target}\``);
                return;
            }

            user = users.find(u => u.ID === userList.ID);
            if (!user) {
                await respond(m, `Can't find user \`${target}\` for some reason CONTACT VINXIS`);
                return;
            }
            if (!user.discord.userID) {
                await respond(m, `User \`${user.osu.username}\` is not linked to a discord account, they need to login via discord first`);
                return;
            }
            // Check if they are in the server
            try {
                const tournamentServer = m.guild ?? await discordClient.guilds.fetch(tournament.server);
                await tournamentServer.members.fetch();
                if (!tournamentServer.members.resolve(user.discord.userID)) {
                    await respond(m, `User \`${user.osu.username}\` is not in the tournament server`);
                    return;
                }
            } catch (e) {
                await respond(m, `Error fetching tournament server. The bot may not be in the server anymore. Contact the tournament's organizers to readd the bot to the server.\n\`\`\`${e}\`\`\``);
                return;
            }
        }
    }

    // Rerun for when the target is a user or if there was no target at all
    if (!team) {
        const teams = await Team
            .createQueryBuilder("team")
            .leftJoinAndSelect("team.captain", "captain")
            .leftJoinAndSelect("team.members", "members")
            .leftJoinAndSelect("team.tournaments", "tournament")
            .where("captain.ID = :ID", { ID: user.ID })
            .getMany();

        if (teams.length === 0) {
            team = await singlePlayerTournamentTeamCreation(m, user, tournament);
            if (!team)
                return;
        } else {
            const tournamentTeamFilter = teams.filter(t => t.tournaments.some(tourney => tourney.ID === tournament.ID));
            if (tournamentTeamFilter.length > 1) {
                await respond(m, `User \`${user.osu.username}\` is in multiple teams for this tournament which SHOULD NEVER HAPPEN CONTACT VINXIS`);
                return;
            } else if (tournamentTeamFilter.length === 1)
                team = tournamentTeamFilter[0];
            else {
                if (tournament.minTeamSize === 1) {
                    const onePlayerTeam = teams.filter(t => t.members.length === 1 && t.members[0].ID === user!.ID);
                    if (onePlayerTeam.length > 1) {
                        team = await getFromList(m, onePlayerTeam, "team", user.osu.username);
                        if (!team) {
                            await respond(m, `Could not find team for user \`${user.osu.username}\``);
                            return;
                        }
                    } else if (onePlayerTeam.length === 1)
                        team = onePlayerTeam[0];
                    else {
                        team = await singlePlayerTournamentTeamCreation(m, user, tournament);
                        if (!team)
                            return;
                    }
                } else {
                    const eligibleTeams = teams.filter(t => t.members.length <= tournament.maxTeamSize && t.members.length >= tournament.minTeamSize);
                    if (eligibleTeams.length > 1) {
                        team = await getFromList(m, eligibleTeams, "team", user.osu.username);
                        if (!team) {
                            await respond(m, `Could not find team for user \`${user.osu.username}\``);
                            return;
                        }
                    } else if (eligibleTeams.length === 1)
                        team = eligibleTeams[0];
                    else {
                        await respond(m, `User \`${user.osu.username}\` is not in a team for this tournament`);
                        return;
                    }
                }
            }
        }
    }

    if (!await confirmCommand(m, `Do you wish to schedule \`${team.name}\` to a qualifier for ${discordStringTimestamp(date)}?`)) {
        await respond(m, "Ok Lol . stopped qualifier scheduling");
        return;
    }

    if (!team.tournaments.some(t => t.ID === tournament.ID)) {
        if (target && !await confirmCommand(m, `<@${user.discord.userID}> do you wish to confirm your registration for ${tournament.name} under team name ${team.name}?`, true, user.discord.userID)) {
            await respond(m, "Ok Lol . stopped tournament registration");
            return;
        }

        // New team, need to check roles
        const teamMembers = [team.captain, ...team.members].filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i);
        const tournamentRoles = await TournamentRole
            .createQueryBuilder("tournamentRole")
            .leftJoin("tournamentRole.tournament", "tournament")
            .where("tournament.ID = :ID", { ID: tournament.ID })
            .getMany();
        const participantRoles = tournamentRoles.filter(r => r.roleType === TournamentRoleType.Participants);
        const captainRoles = tournamentRoles.filter(r => r.roleType === TournamentRoleType.Captains);
        const unallowedRoles = tournamentRoles.filter(r => unallowedToPlay.includes(r.roleType));
        try {
            const tournamentServer = m.guild ?? await discordClient.guilds.fetch(tournament.server);
            await tournamentServer.members.fetch();
            const discordMembers = teamMembers.map(member => tournamentServer.members.resolve(member.discord.userID));
            const memberStaff: GuildMember[] = [];
            for (const discordMember of discordMembers) {
                if (!discordMember)
                    continue;
                if (discordMember.roles.cache.some(r => unallowedRoles.some(tr => tr.roleID === r.id)))
                    memberStaff.push(discordMember);
            }
            if (memberStaff.length > 0) {
                await respond(m, `Some members are staffing and are thus not allowed to play in this tournament:\n\`${memberStaff.map(member => member.displayName).join(", ")}\``);
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
            await respond(m, `Error fetching tournament server. The bot may not be in the server anymore. Contact the tournament's organizers to readd the bot to the server.\n\`\`\`${e}\`\`\``);
            return;
        }

        const tournamentTeams = await Team
            .createQueryBuilder("team")
            .leftJoinAndSelect("team.tournaments", "tournament")
            .leftJoinAndSelect("team.captain", "captain")
            .leftJoinAndSelect("team.members", "members")
            .where("tournament.ID = :ID", { ID: tournament.ID })
            .getMany();

        const tournamentMembers = tournamentTeams.flatMap(t => [t.captain, ...t.members]);
        const alreadyRegistered = teamMembers.filter(member => tournamentMembers.some(tMember => tMember.ID === member.ID));
        if (alreadyRegistered.length > 0) {
            await respond(m, `Some members are already registered in this tournament:\n\`${alreadyRegistered.map(member => member.osu.username).join(", ")}\``);
            return;
        }

        team.tournaments.push(tournament);
    }

    await team.calculateStats();
    await team.save();

    let matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("matchup.teams", "team")
        .where("stage.ID = :stageID", { stageID: stage.ID })
        .andWhere("team.ID = :teamID", { teamID: team.ID })
        .getOne();
    if (matchup) {
        if (matchup.date.getTime() === date.getTime()) {
            await respond(m, `\`${team.name}\` is already scheduled for this date`);
            return;
        }

        if (matchup.mp) {
            if (!await securityChecks(m, true, true, [], [TournamentRoleType.Organizer]))
                return;

            if (!await confirmCommand(m, `\`${team.name}\` already has a scheduled match with an mp ID on ${discordStringTimestamp(matchup.date)}. Do you want to reset and reschedule?`)) {
                await respond(m, "Ok Lol . stopped qualifier reschedule");
                return;
            }
        }

        matchup.date = date;
        matchup.mp = null;
        await MatchupMessage
            .createQueryBuilder()
            .delete()
            .where("matchupID = :ID", { ID: matchup.ID })
            .execute();
        matchup.messages = null;

        const sets = await MatchupSet
            .createQueryBuilder("matchupSet")
            .innerJoin("matchupSet.matchup", "matchup")
            .leftJoinAndSelect("matchupSet.maps", "map")
            .leftJoinAndSelect("map.scores", "score")
            .where("matchup.ID = :ID", { ID: matchup.ID })
            .getMany();
        await Promise.all(sets.flatMap(set => set.maps?.flatMap(map => map.scores?.map(s => s.remove()) ?? [])));
        await Promise.all(sets.flatMap(set => set.maps?.map(map => map.remove())));
        await Promise.all(sets.map(s => s.remove()));

        matchup.sets = null;
    } else {
        matchup = new Matchup();
        matchup.date = date;
        matchup.teams = [ team ];
        matchup.stage = stage;
    }

    await matchup.save();
    try {
        await cron.add(CronJobType.QualifierMatchup, new Date(Math.max(date.getTime() - preInviteTime, Date.now() + 10 * 1000)));
    } catch (err) {
        await respond(m, `Failed to get cron job running to run qualifier match at specified time. Contact VINXIS`);
        return;
    }

    await respond(m, `The qualifier for \`${team.name}\` is now ${discordStringTimestamp(date)}\n\nYou can reschedule with the same command anytime before the match starts if needed.`);
}

const data = new SlashCommandBuilder()
    .setName("tournament_qualifier")
    .setDescription("Schedule yourself/your team (or a user/team if you are an organizer) to play qualifiers")
    .addStringOption(option =>
        option.setName("date")
            .setDescription("The UTC date and/or time (E.g. YYYY-MM-DD HH:MM UTC) / UNIX epoch to play qualifiers in")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("tournament")
            .setDescription("The tournament to schedule for")
            .setRequired(false))
    .addStringOption(option =>
        option.setName("target")
            .setDescription("The user/team to schedule (only works for tournament organizers)")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    date: Date,
    target?: string,
    tournament?: string,
}

const qualifier: Command = {
    data,
    alternativeNames: ["tournamentqualifier", "tournament-qualifier", "schedule_qualifier", "schedule-qualifier", "schedulequalifier", "squalifier", "s_qualifier", "s-qualifier", "schedulequal", "schedule_qual", "schedule-qual", "qualifierschedule", "qualifier_schedule", "qualifier-schedule", "scheduleq", "schedule_q", "schedule-q", "sq", "tqualifier", "t_qualifier", "t-qualifier", "tournamentqual", "tournament_qual", "tournament-qual", "qualifiertournament", "qualifier_tournament", "qualifier-tournament", "tournamentq", "tournament_q", "tournament-q", "tq", "qualifier_team", "teams_qualifier", "team_qualifier", "qualifier-teams", "qualifier-team", "teams-qualifier", "team-qualifier", "teamsqualifier", "teamqualifier", "qualifierteams", "qualifierteam", "qualifiert", "teams", "teamss", "steam", "steams"],
    category: "tournaments",
    run,
};

export default qualifier;
