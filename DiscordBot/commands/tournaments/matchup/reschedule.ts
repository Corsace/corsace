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
        if (matchup.team1?.captain.discord.userID)
            pings.push(`<@${matchup.team1.captain.discord.userID}>`);
        if (matchup.team2?.captain.discord.userID)
            pings.push(`<@${matchup.team2.captain.discord.userID}>`);
        if (matchup.referee?.discord.userID)
            pings.push(`<@${matchup.referee.discord.userID}>`);
        if (matchup.streamer?.discord.userID)
            pings.push(`<@${matchup.streamer.discord.userID}>`);
        if (matchup.commentators && matchup.commentators.length > 0)
            pings.push(matchup.commentators.map((commentator) => `<@${commentator.discord.userID}>`).join(" "));
        await rescheduleChannelMessage.send(`${pings.join(" ")}\n\nMatchup ID ${matchup.ID} in stage \`${matchup.stage?.name ?? "N/A"}\` between \`${matchup.team1?.name ?? "N/A"}\` and \`${matchup.team2?.name ?? "N/A"}\` has been rescheduled from ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)} to ${matchup.date.toUTCString()} ${discordStringTimestamp(matchup.date)}\n\nAny relevant staff members should confirm that they are available at this time, or remove themselves from the matchup otherwise.`);
    } catch (e) {
        if (!(e instanceof DiscordAPIError) || e.code !== 10003) 
            throw e;
    }
}

async function run (m: Message | ChatInputCommandInteraction) {
    const message = await respond(m, "Rescheduling matchup...");

    const params = await extractParameters<parameters>(m, [
        { name: "date", paramType: "string", customHandler: extractDate },
        { name: "matchup", paramType: "integer", optional: true },
        { name: "tournament", paramType: "string", optional: true },
    ]); 
    if (!params)
        return;

    const { date, matchup: matchupID, tournament: tournamentParam } = params;

    if (isNaN(date.getTime())) {
        await message.edit("Invalid date. Provide a valid date using either `YYYY-MM-DD HH:MM UTC` format, or a unix/epoch timestamp in seconds.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/)");
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
            .leftJoinAndSelect("team1.captain", "captain1")
            .leftJoinAndSelect("team2.captain", "captain2")
            .leftJoinAndSelect("matchup.referee", "referee")
            .leftJoinAndSelect("matchup.streamer", "streamer")
            .leftJoinAndSelect("matchup.commentators", "commentators")
            .leftJoinAndSelect("matchup.potentialFor", "potentialFor")
            .leftJoinAndSelect("potentialFor.previousMatchups", "potentialForPreviousMatchups")
            .leftJoinAndSelect("potentialFor.nextMatchups", "potentialForNextMatchups")
            .leftJoinAndSelect("potentialForNextMatchups.potentials", "potentialForNextMatchupsPotentials", "potentialForNextMatchupsPotentials.invalid = 0")
            .leftJoinAndSelect("matchup.previousMatchups", "previousMatchups")
            .leftJoinAndSelect("matchup.nextMatchups", "nextMatchups")
            .leftJoinAndSelect("nextMatchups.potentials", "nextMatchupsPotentials", "nextMatchupsPotentials.invalid = 0")
            .where("matchup.ID = :matchupID", { matchupID })
            .andWhere("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
            .getOne();
        
        if (!matchup) {
            await message.edit("Invalid matchup ID provided");
            return;
        }

        if (
            matchup.team1?.captain.discord.userID !== commandUser(m).id && 
            matchup.team2?.captain.discord.userID !== commandUser(m).id && 
            matchup.referee?.discord.userID !== commandUser(m).id
        ) {
            if (!await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Referees]))
                return;

            if (!await confirmCommand(m, `Do you wish to reschedule the matchup ID ${matchup.ID} in stage \`${matchup.stage?.name ?? "N/A"}\` between \`${matchup.team1?.name ?? "N/A"}\` and \`${matchup.team2?.name ?? "N/A"}\` to ${discordStringTimestamp(date)}?`)) {
                await message.edit("Ok Lol . stopped reschedule");
                return;
            }

            const prevDate = matchup.date;
            matchup.date = date;
            await matchup.save();
            await message.edit(`Matchup rescheduled from ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)} to ${date.toUTCString()} ${discordStringTimestamp(date)}`);
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
            .leftJoinAndSelect("team1.captain", "captain1")
            .leftJoinAndSelect("team2.captain", "captain2")
            .leftJoinAndSelect("matchup.referee", "referee")
            .leftJoinAndSelect("matchup.streamer", "streamer")
            .leftJoinAndSelect("matchup.commentators", "commentators")
            .leftJoinAndSelect("matchup.potentialFor", "potentialFor")
            .leftJoinAndSelect("potentialFor.previousMatchups", "potentialForPreviousMatchups")
            .leftJoinAndSelect("potentialFor.nextMatchups", "potentialForNextMatchups")
            .leftJoinAndSelect("potentialForNextMatchups.potentials", "potentialForNextMatchupsPotentials", "potentialForNextMatchupsPotentials.invalid = 0")
            .leftJoinAndSelect("matchup.previousMatchups", "previousMatchups")
            .leftJoinAndSelect("matchup.nextMatchups", "nextMatchups")
            .leftJoinAndSelect("nextMatchups.potentials", "nextMatchupsPotentials", "nextMatchupsPotentials.invalid = 0")
            .where("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
            .andWhere("matchup.date > :date", { date: new Date().toISOString() })
            .andWhere("captain1.discordUserid = :userID OR captain2.discordUserid = :userID", { userID: commandUser(m).id })
            .getMany();

        if (matchups.length === 0) {
            await message.edit("Ur not in any matchups that can be rescheduled (u must be a captain of a team to reschedule a matchup)");
            return;
        }

        const matchupList = matchups.map((matchup) => {
            return {
                ID: matchup.ID,
                name: `${matchup.team1?.name ?? "N/A"} vs ${matchup.team2?.name ?? "N/A"} in ${matchup.stage?.name ?? "N/A"}`,
            };
        });
        const matchupListResult = await getFromList(m, matchupList, "matchup", tournamentParam ?? channelID(m));
        if (!matchupListResult) {
            await message.edit("Could not find a valid matchup");
            return;
        }

        matchup = matchups.find((matchup) => matchup.ID === matchupListResult.ID)!;
    }

    if (matchup.previousMatchups && matchup.previousMatchups.length > 0) {
        const previousMatchupAfterDate = matchup.previousMatchups.find((previousMatchup) => date.getTime() < (previousMatchup.date.getTime() + 3600000));
        if (previousMatchupAfterDate) {
            await message.edit(`U cant reschedule a matchup to a time that is BEFORE 1 hour after a matchup that the one ur rescheduling depends on, see matchup ID ${previousMatchupAfterDate.ID} (${previousMatchupAfterDate.date.toUTCString()} ${discordStringTimestamp(previousMatchupAfterDate.date)})`);
            return;
        }
    }

    if (matchup.nextMatchups && matchup.nextMatchups.length > 0) {
        const nextMatchupBeforeDate = matchup.nextMatchups.find((nextMatchup) => date.getTime() > (nextMatchup.date.getTime() - 3600000));
        if (nextMatchupBeforeDate) {
            await message.edit(`U cant reschedule a matchup to a time that is AFTER 1 hour before a matchup that is dependant on this one, see matchup ID ${nextMatchupBeforeDate.ID} (${nextMatchupBeforeDate.date.toUTCString()} ${discordStringTimestamp(nextMatchupBeforeDate.date)})`);
            return;
        }

        const potentials = matchup.nextMatchups
            .filter((nextMatchup) => nextMatchup.potentials && nextMatchup.potentials.filter(potential => !potential.invalid).length > 0)
            .flatMap((nextMatchup) => nextMatchup.potentials!.filter(potential => !potential.invalid));
        const potentialsBeforeDate = potentials.find((potential) => date.getTime() > (potential.date.getTime() - 3600000));
        if (potentialsBeforeDate) {
            await message.edit(`U cant reschedule a matchup to a time that is AFTER 1 hour before a matchup that is dependant on this one, see POTENTIAL matchup ID ${potentialsBeforeDate.ID} (${potentialsBeforeDate.date.toUTCString()} ${discordStringTimestamp(potentialsBeforeDate.date)})`);
            return;
        }
    }

    // If the matchup is within 24 hours of the stage starting, dont allow it to be rescheduled
    const dayBeforeStart = matchup.stage!.timespan.start.getTime() - 86400000;
    if (Date.now() > dayBeforeStart) {
        await message.edit(`U cant reschedule a matchup within 24 hours of the stage starting noob (${new Date(dayBeforeStart).toUTCString()} ${discordStringTimestamp(new Date(dayBeforeStart))})`);
        return;
    }

    const prevDate = matchup.date;

    if (date.getTime() < matchup.stage!.timespan.start.getTime()) {
        await message.edit(`U cant reschedule a matchup to before the stage starts Lol (${date.toUTCString()} ${discordStringTimestamp(matchup.stage!.timespan.start)})`);
        return;
    }

    if (date.getTime() > matchup.stage!.timespan.end.getTime()) {
        await message.edit(`U cant reschedule a matchup to after the stage ends Lol (${date.toUTCString()} ${discordStringTimestamp(matchup.stage!.timespan.end)})`);
        return;
    }

    if (date.getTime() < Date.now()) {
        await message.edit("U cant reschedule a matchup to before the current time...");
        return;
    }

    // Check for any other matchups within 1 hour of the new time
    const existing = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("matchup.potentialFor", "potentialFor")
        .where("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .andWhere("matchup.date > :date", { date: new Date(date.getTime() - 3600000) })
        .andWhere("matchup.date < :date2", { date2: new Date(date.getTime() + 3600000) })
        .andWhere(new Brackets((qb) => {
            qb.where("matchup.ID != :matchupID", { matchupID: matchup!.ID })
                .orWhere("matchup.ID != :potentialID", { potentialID: matchup!.potentialFor?.ID ?? 0 })
                .orWhere("potentialFor.ID != :matchupID2", { matchupID2: matchup!.ID })
                .orWhere("potentialFor.ID != :potentialID2", { potentialID2: matchup!.potentialFor?.ID ?? 0 });
        }))
        .andWhere("matchup.invalid = 0")
        .andWhere(new Brackets((qb) => {
            qb.where("team1.ID = :team1ID1", { team1ID1: matchup!.team1?.ID })
                .orWhere("team2.ID = :team2ID1", { team2ID1: matchup!.team1?.ID })
                .orWhere("team1.ID = :team1ID2", { team1ID2: matchup!.team2?.ID })
                .orWhere("team2.ID = :team2ID2", { team2ID2: matchup!.team2?.ID });
        }))
        .getOne();

    if (existing) {
        await message.edit(`YO theres already a matchup scheduled for ${date.toUTCString()} ${discordStringTimestamp(date)} between \`${existing.team1?.name ?? "N/A"}\` and \`${existing.team2?.name ?? "N/A"}\` this is gonna cause a conflict for the teams cuz it's within 1 hour of the new time`);
        return;
    }

    if (matchup.team1 && !await confirmCommand(m, `<@${matchup.team1.captain.discord.userID}> U wanna reschedule ur match${matchup.team2 ? ` vs \`${matchup.team2.name}\`` : ""} from ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)} to ${date.toUTCString()} ${discordStringTimestamp(date)}?`, true, matchup.team1.captain.discord.userID, dayBeforeStart - Date.now())) {
        await message.edit(`Ok Lol . <@${matchup.team1.captain.discord.userID}> stopped reschedule or the message timed out`);
        return;
    }

    if (dayBeforeStart - Date.now() < 0) {
        await message.edit(`U mightve took too long... cant reschedule a matchup within 24 hours of the stage starting (${new Date(dayBeforeStart).toUTCString()} ${discordStringTimestamp(new Date(dayBeforeStart))})`);
        return;
    }

    if (matchup.team2 && !await confirmCommand(m, `<@${matchup.team2.captain.discord.userID}> U wanna reschedule ur match${matchup.team1 ? ` vs \`${matchup.team1.name}\`` : ""} from ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)} to ${date.toUTCString()} ${discordStringTimestamp(date)}?`, true, matchup.team2.captain.discord.userID, dayBeforeStart - Date.now())) {
        await message.edit(`Ok Lol . <@${matchup.team2.captain.discord.userID}> stopped reschedule or the message timed out`);
        return;
    }

    if (dayBeforeStart - Date.now() < 0) {
        await message.edit(`U mightve took too long... cant reschedule a matchup within 24 hours of the stage starting (${new Date(dayBeforeStart).toUTCString()} ${discordStringTimestamp(new Date(dayBeforeStart))})`);
        return;
    }

    matchup.date = date;
    await matchup.save();
    await message.edit(`Matchup rescheduled from ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)} to ${date.toUTCString()} ${discordStringTimestamp(date)}`);
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
