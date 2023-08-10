import { ChatInputCommandInteraction, Message, SlashCommandBuilder, DiscordAPIError } from "discord.js";
import { Command } from "../..";
import getFromList from "../../../functions/getFromList";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import channelID from "../../../functions/channelID";
import commandUser from "../../../functions/commandUser";
import { extractDate } from "../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { discordStringTimestamp } from "../../../../Server/utils/dateParse";
import { extractParameters } from "../../../functions/parameterFunctions";
import respond from "../../../functions/respond";
import confirmCommand from "../../../functions/confirmCommand";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { TournamentRoleType } from "../../../../Interfaces/tournament";
import { TournamentChannel } from "../../../../Models/tournaments/tournamentChannel";
import { discordClient } from "../../../../Server/discord";
import { Brackets } from "typeorm";

async function rescheduleLog (matchup: Matchup, prevDate: Date) {
    const rescheduleChannel = await TournamentChannel
        .createQueryBuilder("tournamentChannel")
        .innerJoin("tournamentChannel.tournament", "tournament")
        .where("tournament.ID = :tournamentID", { tournamentID: matchup.stage!.tournament.ID })
        .andWhere("tournamentChannel.channelType = '15'")
        .getOne();

    if (!rescheduleChannel)
        return;

    try {
        const rescheduleChannelMessage = await discordClient.channels.fetch(rescheduleChannel.channelID);
        if (!rescheduleChannelMessage?.isTextBased())
            return;

        const pings: string[] = [];
        if (matchup.team1?.manager.discord.userID)
            pings.push(`<@${matchup.team1.manager.discord.userID}>`);
        if (matchup.team2?.manager.discord.userID)
            pings.push(`<@${matchup.team2.manager.discord.userID}>`);
        if (matchup.referee?.discord.userID)
            pings.push(`<@${matchup.referee.discord.userID}>`);
        if (matchup.streamer?.discord.userID)
            pings.push(`<@${matchup.streamer.discord.userID}>`);
        if (matchup.commentators && matchup.commentators.length > 0)
            pings.push(matchup.commentators.map((commentator) => `<@${commentator.discord.userID}>`).join(" "));
        await rescheduleChannelMessage.send(`${pings.join(" ")}\n\nMatchup ID ${matchup.ID} in stage \`${matchup.stage?.name || "N/A"}\` between \`${matchup.team1?.name || "N/A"}\` and \`${matchup.team2?.name || "N/A"}\` has been rescheduled from ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)} to ${matchup.date.toUTCString()} ${discordStringTimestamp(matchup.date)}\n\nAny relevant staff members should confirm that they are available at this time, or remove themselves from the matchup otherwise.`);
    } catch (e) {
        if (!(e instanceof DiscordAPIError) || e.code !== 10003) 
            throw e;
    }
}

async function run (m: Message | ChatInputCommandInteraction) {
    await respond(m, "Rescheduling matchup...");

    const params = extractParameters<parameters>(m, [
        { name: "date", paramType: "string", customHandler: extractDate },
        { name: "matchup", paramType: "integer", optional: true },
        { name: "tournament", paramType: "string", optional: true },
    ]); 
    if (!params)
        return;

    const { date, matchup: matchupID, tournament: tournamentParam } = params;

    if (isNaN(date.getTime())) {
        await respond(m, "Invalid date. Provide a valid date using either `YYYY-MM-DD HH:MM UTC` format, or a unix/epoch timestamp in seconds.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/)");
        return;
    }

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel", undefined, true);
    if (!tournament)
        return;
    
    let matchup: Matchup | null = null;
    // For organizers or referees, allow them to reschedule any matchup
    if (matchupID) {
        matchup = await Matchup
            .createQueryBuilder("matchup")
            .innerJoinAndSelect("matchup.stage", "stage")
            .innerJoinAndSelect("stage.tournament", "tournament")
            .leftJoinAndSelect("matchup.team1", "team1")
            .leftJoinAndSelect("matchup.team2", "team2")
            .leftJoinAndSelect("team1.manager", "manager1")
            .leftJoinAndSelect("team2.manager", "manager2")
            .leftJoinAndSelect("matchup.referee", "referee")
            .leftJoinAndSelect("matchup.streamer", "streamer")
            .leftJoinAndSelect("matchup.commentators", "commentators")
            .where("matchup.ID = :matchupID", { matchupID })
            .andWhere("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
            .getOne();
        
        if (!matchup) {
            await respond(m, "Invalid matchup ID provided");
            return;
        }

        if (
            matchup.team1?.manager.discord.userID !== commandUser(m).id && 
            matchup.team2?.manager.discord.userID !== commandUser(m).id && 
            matchup.referee?.discord.userID !== commandUser(m).id
        ) {
            if (!await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Referees]))
                return;

            if (!await confirmCommand(m, `Do you wish to reschedule the matchup ID ${matchup.ID} in stage \`${matchup.stage?.name || "N/A"}\` between \`${matchup.team1?.name || "N/A"}\` and \`${matchup.team2?.name || "N/A"}\` to ${discordStringTimestamp(date)}?`)) {
                await respond(m, "Ok Lol");
                return;
            }

            const prevDate = matchup.date;
            matchup.date = date;
            await matchup.save();
            await respond(m, `Matchup rescheduled from ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)} to ${date.toUTCString()} ${discordStringTimestamp(date)}`);
            await rescheduleLog(matchup, prevDate);
            return;
        }
    } else {
        // For everyone else, only allow them to reschedule matchups they are in
        const matchups = await Matchup
            .createQueryBuilder("matchup")
            .innerJoinAndSelect("matchup.stage", "stage")
            .innerJoinAndSelect("stage.tournament", "tournament")
            .leftJoinAndSelect("matchup.team1", "team1")
            .leftJoinAndSelect("matchup.team2", "team2")
            .leftJoinAndSelect("team1.manager", "manager1")
            .leftJoinAndSelect("team2.manager", "manager2")
            .leftJoinAndSelect("matchup.referee", "referee")
            .leftJoinAndSelect("matchup.streamer", "streamer")
            .leftJoinAndSelect("matchup.commentators", "commentators")
            .where("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
            .andWhere("matchup.date > :date", { date: new Date() })
            .andWhere("manager1.discordUserid = :userID OR manager2.discordUserid = :userID", { userID: commandUser(m).id })
            .getMany();

        if (matchups.length === 0) {
            await respond(m, "You are not in any matchups that can be rescheduled. Note that you must be a manager of a team to reschedule a matchup");
            return;
        }

        const matchupList = matchups.map((matchup) => {
            return {
                ID: matchup.ID,
                name: `${matchup.team1?.name || "N/A"} vs ${matchup.team2?.name || "N/A"} in ${matchup.stage?.name || "N/A"}`,
            };
        });
        const matchupListResult = await getFromList(m, matchupList, "matchup", tournamentParam || channelID(m));
        if (!matchupListResult) {
            await respond(m, "Could not find a valid matchup");
            return;
        }

        matchup = matchups.find((matchup) => matchup.ID === matchupListResult.ID)!;

        // If the matchup is within 24 hours of the stage starting, dont allow it to be rescheduled, unless the user is an organizer or referee (in which case, allow it)
        const dayBeforeStart = matchup.stage!.timespan.start.getTime() - 86400000;
        if (Date.now() > dayBeforeStart) {
            await respond(m, `U cant reschedule a matchup within 24 hours of the stage starting noob (${new Date(dayBeforeStart).toUTCString()} ${discordStringTimestamp(new Date(dayBeforeStart))})`);
            return;
        }
    }

    const prevDate = matchup.date;

    if (date.getTime() < matchup.stage!.timespan.start.getTime()) {
        await respond(m, `U cant reschedule a matchup to before the stage starts Lol (${date.toUTCString()} ${discordStringTimestamp(matchup.stage!.timespan.start)})`);
        return;
    }

    if (date.getTime() > matchup.stage!.timespan.end.getTime()) {
        await respond(m, `U cant reschedule a matchup to after the stage ends Lol (${date.toUTCString()} ${discordStringTimestamp(matchup.stage!.timespan.end)})`);
        return;
    }

    if (date.getTime() < Date.now()) {
        await respond(m, "U cant reschedule a matchup to before the current time...");
        return;
    }

    // Check for any other matchups within 1 hour of the new time
    const existing = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .where("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .andWhere("matchup.date > :date", { date: new Date(date.getTime() - 3600000) })
        .andWhere("matchup.date < :date2", { date2: new Date(date.getTime() + 3600000) })
        .andWhere("matchup.ID != :matchupID", { matchupID: matchup.ID })
        .andWhere(new Brackets((qb) => {
            qb.where("team1.ID = :team1ID1", { team1ID1: matchup!.team1?.ID })
                .orWhere("team2.ID = :team2ID1", { team2ID1: matchup!.team1?.ID })
                .orWhere("team1.ID = :team1ID2", { team1ID2: matchup!.team2?.ID })
                .orWhere("team2.ID = :team2ID2", { team2ID2: matchup!.team2?.ID });
        }))
        .getOne();

    if (existing) {
        await respond(m, `YO theres already a matchup scheduled for ${date.toUTCString()} ${discordStringTimestamp(date)} between \`${existing.team1?.name || "N/A"}\` and \`${existing.team2?.name || "N/A"}\` this is gonna cause a conflict for the teams cuz it's within 1 hour of the new time`);
        return;
    }

    if (matchup.team1 && !await confirmCommand(m, `<@${matchup.team1.manager.discord.userID}> U wanna reschedule ur match${matchup.team2 ? ` vs \`${matchup.team2.name}\`` : ""} from ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)} to ${date.toUTCString()} ${discordStringTimestamp(date)}?`, true, matchup.team1.manager.discord.userID)) {
        await respond(m, "Ok Lol");
        return;
    }

    if (matchup.team2 && !await confirmCommand(m, `<@${matchup.team2.manager.discord.userID}> U wanna reschedule ur match${matchup.team1 ? ` vs \`${matchup.team1.name}\`` : ""} from ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)} to ${date.toUTCString()} ${discordStringTimestamp(date)}?`, true, matchup.team2.manager.discord.userID)) {
        await respond(m, "Ok Lol");
        return;
    }

    matchup.date = date;
    await matchup.save();
    await respond(m, `Matchup rescheduled from ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)} to ${date.toUTCString()} ${discordStringTimestamp(date)}`);
    await rescheduleLog(matchup, prevDate);
}

const data = new SlashCommandBuilder()
    .setName("matchup_reschedule")
    .setDescription("Reschedule a matchup your team is in")
    .addStringOption(option =>
        option.setName("date")
            .setDescription("The UTC date and/or time (E.g. YYYY-MM-DD HH:MM UTC) / UNIX epoch to reschedule to")
            .setRequired(true))
    .addStringOption(option => 
        option.setName("tournament")
            .setDescription("The tournament to reschedule for")
            .setRequired(false))
    .addIntegerOption(option => 
        option.setName("matchup")
            .setDescription("The ID of the matchup to reschedule")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    date: Date,
    matchup?: number,
    tournament?: string,
}

const matchupReschedule: Command = {
    data,
    alternativeNames: ["reschedule_matchup", "reschedule-matchup", "matchup-reschedule", "matchupreschedule", "reschedulematchup", "reschedulem", "mreschedule", "matchupr", "rmatchup", "matchup_resched", "resched_matchup", "resched-matchup", "matchup-resched", "matchupresched", "reschedmatchup", "reschedm", "mresched"],
    category: "tournaments",
    subCategory: "matchups",
    run,
};

export default matchupReschedule;
