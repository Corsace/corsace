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
// import { Brackets } from "typeorm";

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
        await rescheduleChannelMessage.send(`${pings.join(" ")}\n\nMatchup ID \`${matchup.matchID ?? matchup.ID}\` in stage \`${matchup.stage?.name ?? "N/A"}\` between \`${matchup.team1?.name ?? "N/A"}\` and \`${matchup.team2?.name ?? "N/A"}\` has been rescheduled\nFrom ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)}\nTo ${matchup.date.toUTCString()} ${discordStringTimestamp(matchup.date)}\n\nAny relevant staff members should confirm that they are available at this time, or remove themselves from the matchup otherwise.`);
    } catch (e) {
        if (!(e instanceof DiscordAPIError) || e.code !== 10003) 
            throw e;
    }
}

async function run (m: Message | ChatInputCommandInteraction) {
    const message = await respond(m, "Rescheduling matchup...");

    const params = await extractParameters<parameters>(m, [
        { name: "date", paramType: "string", customHandler: extractDate },
        { name: "matchup", paramType: "string", optional: true },
        { name: "tournament", paramType: "string", optional: true },
    ]); 
    if (!params)
        return;

    const { date, matchup: matchupID, tournament: tournamentParam } = params;

    if (isNaN(date.getTime())) {
        await message.edit("Invalid date\nProvide a valid date using either `YYYY-MM-DD HH:MM UTC` format\nOr a unix/epoch timestamp in seconds.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/)");
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
            .where("(matchup.ID = :matchupID OR matchup.matchID = :matchupID)", { matchupID })
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

            if (!await confirmCommand(m, `Do you wish to reschedule the matchup ID \`${matchup.matchID ?? matchup.ID}\` in stage \`${matchup.stage?.name ?? "N/A"}\` between \`${matchup.team1?.name ?? "N/A"}\` and \`${matchup.team2?.name ?? "N/A"}\` to ${discordStringTimestamp(date)}?`)) {
                await message.edit("Ok Lol . stopped reschedule");
                return;
            }

            const prevDate = matchup.date;
            matchup.date = date;
            await matchup.save();
            await message.edit(`Matchup ID \`${matchup.matchID ?? matchup.ID}\` rescheduled\nFrom ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)}\nTo ${date.toUTCString()} ${discordStringTimestamp(date)}`);
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
            .where("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
            .andWhere("matchup.date > :date", { date: new Date().toISOString() })
            .andWhere("captain1.discordUserid = :userID OR captain2.discordUserid = :userID", { userID: commandUser(m).id })
            .getMany();

        if (matchups.length === 0) {
            await message.edit("Ur not in any matchups that can be rescheduled (u must be a captain of a team to reschedule a matchup)");
            return;
        }

        const matchupList = matchups.map((match) => {
            return {
                ID: match.ID,
                name: `${match.team1?.name ?? "N/A"} vs ${match.team2?.name ?? "N/A"} in ${match.stage?.name ?? "N/A"}`,
            };
        });
        const matchupListResult = await getFromList(m, matchupList, "matchup", tournamentParam ?? channelID(m));
        if (!matchupListResult) {
            await message.edit("Could not find a valid matchup");
            return;
        }

        matchup = matchups.find((match) => match.ID === matchupListResult.ID)!;
    }

    const previousMatchups = await Matchup
        .createQueryBuilder("matchup")
        .leftJoin("matchup.loserNextMatchup", "loserNextMatchup")
        .leftJoin("matchup.winnerNextMatchup", "winnerNextMatchup")
        .where("matchup.invalid = 0")
        .andWhere("(loserNextMatchup.ID = :matchupID OR winnerNextMatchup.ID = :matchupID)", { matchupID: matchup.ID })
        .getMany();
    if (previousMatchups.length > 0) {
        const previousMatchupAfterDate = previousMatchups.find((previousMatchup) => date.getTime() < (previousMatchup.date.getTime() + 3600000));
        if (previousMatchupAfterDate) {
            await message.edit(`U cant reschedule a matchup to a time that is BEFORE 1 hour after a matchup that the one ur rescheduling depends on\nSee matchup ID \`${previousMatchupAfterDate.matchID ?? previousMatchupAfterDate.ID}\` (${previousMatchupAfterDate.date.toUTCString()} ${discordStringTimestamp(previousMatchupAfterDate.date)})`);
            return;
        }
    }

    const nextMatchups = await Matchup
        .createQueryBuilder("matchup")
        .leftJoin("matchup.loserPreviousMatchups", "loserPreviousMatchup")
        .leftJoin("matchup.winnerPreviousMatchups", "winnerPreviousMatchup")
        .where("matchup.invalid = 0")
        .andWhere("(loserPreviousMatchup.ID = :matchupID OR winnerPreviousMatchup.ID = :matchupID)", { matchupID: matchup.ID })
        .getMany();
    
    if (nextMatchups && nextMatchups.length > 2) {
        await message.edit("You have a bigger problem than rescheduling this matchup, there are more than 2 matchups that your matchup depends on, contact a tournament organizer to fix this NOW!!!");
        return;
    }
    if (nextMatchups && nextMatchups.length > 0) {
        const nextMatchupBeforeDate = nextMatchups.find((nextMatchup) => date.getTime() > (nextMatchup.date.getTime() - 3600000));
        if (nextMatchupBeforeDate) {
            await message.edit(`U cant reschedule a matchup to a time that is AFTER 1 hour before a matchup that is dependant on this one\nSee matchup ID \`${nextMatchupBeforeDate.matchID ?? nextMatchupBeforeDate.ID}\` (${nextMatchupBeforeDate.date.toUTCString()} ${discordStringTimestamp(nextMatchupBeforeDate.date)})`);
            return;
        }

        const potentials = await Matchup
            .createQueryBuilder("matchup")
            .leftJoin("matchup.potentialFor", "potentialFor")
            .where("potentialFor.ID  IN (:...nextMatchups)", { nextMatchups: nextMatchups.map((nextMatchup) => nextMatchup.ID) })
            .andWhere("matchup.invalid = 0")
            .getMany();
        const potentialsBeforeDate = potentials.find((potential) => date.getTime() > (potential.date.getTime() - 3600000));
        if (potentialsBeforeDate) {
            await message.edit(`U cant reschedule a matchup to a time that is AFTER 1 hour before a matchup that is dependant on this one\nSee POTENTIAL matchup ID \`${potentialsBeforeDate.matchID ?? potentialsBeforeDate.ID}\` (${potentialsBeforeDate.date.toUTCString()} ${discordStringTimestamp(potentialsBeforeDate.date)})`);
            return;
        }
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

    // Leaving this commented for now until this actually becomes a thing wanted in any situation ever
    // // Check for any other matchups within 1 hour of the new time
    // const existing = await Matchup
    //     .createQueryBuilder("matchup")
    //     .innerJoin("matchup.stage", "stage")
    //     .innerJoin("stage.tournament", "tournament")
    //     .leftJoinAndSelect("matchup.team1", "team1")
    //     .leftJoinAndSelect("matchup.team2", "team2")
    //     .leftJoinAndSelect("matchup.potentialFor", "potentialFor")
    //     .where("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
    //     .andWhere("matchup.date > :date", { date: new Date(date.getTime() - 3600000) })
    //     .andWhere("matchup.date < :date2", { date2: new Date(date.getTime() + 3600000) })
    //     .andWhere(new Brackets((qb) => {
    //         qb.where("matchup.ID != :matchupID", { matchupID: matchup!.ID })
    //             .orWhere("matchup.ID != :potentialID", { potentialID: matchup!.potentialFor?.ID ?? 0 })
    //             .orWhere("potentialFor.ID != :matchupID2", { matchupID2: matchup!.ID })
    //             .orWhere("potentialFor.ID != :potentialID2", { potentialID2: matchup!.potentialFor?.ID ?? 0 });
    //     }))
    //     .andWhere("matchup.invalid = 0")
    //     .andWhere(new Brackets((qb) => {
    //         qb.where("team1.ID = :team1ID1", { team1ID1: matchup!.team1?.ID })
    //             .orWhere("team2.ID = :team2ID1", { team2ID1: matchup!.team1?.ID })
    //             .orWhere("team1.ID = :team1ID2", { team1ID2: matchup!.team2?.ID })
    //             .orWhere("team2.ID = :team2ID2", { team2ID2: matchup!.team2?.ID });
    //     }))
    //     .getOne();

    // if (existing) {
    //     await message.edit(`YO theres already a matchup scheduled for ${date.toUTCString()} ${discordStringTimestamp(date)} between \`${existing.team1?.name ?? "N/A"}\` and \`${existing.team2?.name ?? "N/A"}\` this is gonna cause a conflict for the teams cuz it's within 1 hour of the new time`);
    //     return;
    // }

    const timeLimit = new Date(Math.min(date.getTime(), matchup.date.getTime()) - 24 * 60 * 60 * 1000); // 24 hours before the current matchup date or proposed date, whichever is earlier
    if (timeLimit.getTime() < Date.now()) {
        await message.edit(`U cant reschedule a matchup within 24 hours of its current schedule or proposed schedule, contact an organizer`);
        return;
    }

    if (matchup.team1 && !await confirmCommand(m, `<@${matchup.team1.captain.discord.userID}> U wanna reschedule ur match \`${matchup.matchID ?? matchup.ID}\`${matchup.team2 ? ` vs \`${matchup.team2.name}\`` : ""}\nFrom ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)}\nTo ${date.toUTCString()} ${discordStringTimestamp(date)}?`, true, matchup.team1.captain.discord.userID, timeLimit.getTime() - Date.now())) {
        await message.edit(`Ok Lol . <@${matchup.team1.captain.discord.userID}> stopped reschedule or the message timed out`);
        return;
    }

    if (timeLimit.getTime() < Date.now()) {
        await message.edit(`U mightve took too long... cant reschedule a matchup within 24 hours of its current schedule or proposed schedule, contact an organizer`);
        return;
    }

    if (matchup.team2 && !await confirmCommand(m, `<@${matchup.team2.captain.discord.userID}> U wanna reschedule ur match \`${matchup.matchID ?? matchup.ID}\`${matchup.team1 ? ` vs \`${matchup.team1.name}\`` : ""}\nFrom ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)}\nTo ${date.toUTCString()} ${discordStringTimestamp(date)}?`, true, matchup.team2.captain.discord.userID, timeLimit.getTime() - Date.now())) {
        await message.edit(`Ok Lol . <@${matchup.team2.captain.discord.userID}> stopped reschedule or the message timed out`);
        return;
    }

    if (timeLimit.getTime() < Date.now()) {
        await message.edit(`U mightve took too long... cant reschedule a matchup within 24 hours of its current schedule or proposed schedule, contact an organizer`);
        return;
    }

    matchup.date = date;
    await matchup.save();
    await message.edit(`Matchup ID \`${matchup.matchID ?? matchup.ID}\` rescheduled\nFrom ${prevDate.toUTCString()} ${discordStringTimestamp(prevDate)}\nTo ${date.toUTCString()} ${discordStringTimestamp(date)}`);
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
    .addStringOption(option => 
        option.setName("matchup")
            .setDescription("The ID of the matchup to reschedule")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    date: Date,
    matchup?: string,
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
