import { Message, EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction,  TextChannel } from "discord.js";
import { Command } from "../../index";
import { loginResponse } from "../../../functions/loginResponse";
import { extractParameters } from "../../../functions/parameterFunctions";
import { extractTargetText } from "../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import { TournamentRoleType } from "../../../../Interfaces/tournament";
import getStaff from "../../../functions/tournamentFunctions/getStaff";
import channelID from "../../../functions/channelID";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { discordStringTimestamp } from "../../../../Server/utils/dateParse";

const refValues = ["referee", "ref", "r", "referees", "refs", "rs"] as const;
const commentValues = ["commentator", "comment", "c", "commentators", "comments", "cs"] as const;
const streamValues = ["streamer", "stream", "s", "streamers", "streams", "ss"] as const;
const filterValues = ["all", "assigned", "unassigned", "team", ...refValues, ...commentValues, ...streamValues] as const;

type referee = typeof refValues[number];
type commentator = typeof commentValues[number];
type streamer = typeof streamValues[number];
type filter = typeof filterValues[number];

function isFilter (type: filter): boolean {
    return filterValues.includes(type);
}

function isReferee (type: referee): boolean {
    return refValues.includes(type);
}

function isCommentator (type: commentator): boolean {
    return commentValues.includes(type);
}

function isStreamer (type: streamer): boolean {
    return streamValues.includes(type);
}

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const params = extractParameters<parameters>(m, [
        { name: "filter", paramType: "string" },
        { name: "tournament", paramType: "string", optional: true },
        { name: "user", paramType: "string", customHandler: extractTargetText, optional: true },
    ]);
    if (!params)
        return;

    const { filter, tournament: tournamentParam, user: target } = params;
    if (!isFilter(filter)) {
        await respond(m, "Invalid filter provided");
        return;
    }

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel", undefined, true, true);
    if (!tournament)
        return;

    let user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    if (target) {
        user = await getStaff(m, tournament, target, [TournamentRoleType.Organizer, TournamentRoleType.Referees, TournamentRoleType.Commentators, TournamentRoleType.Streamers]);
        if (!user)
            return;
    }

    const matchupsQ = Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("team1.manager", "team1manager")
        .leftJoinAndSelect("team1.members", "team1members")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team2.manager", "team2manager")
        .leftJoinAndSelect("team2.members", "team2members")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.streamer", "streamer")
        .leftJoinAndSelect("matchup.commentators", "commentators")
        .where("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .andWhere("matchup.date > :now", { now: new Date() });

    if (filter === "assigned")
        matchupsQ.andWhere("referee.ID = :userID OR streamer.ID = :userID OR commentators.ID = :userID", { userID: user.ID });
    else if (filter === "unassigned")
        matchupsQ.andWhere("referee.ID IS NULL OR streamer.ID IS NULL OR (streamer.ID IS NOT NULL AND commentators.ID IS NULL)");
    else if (filter === "team")
        matchupsQ.andWhere("team1manager.ID = :userID OR team2manager.ID = :userID OR team1members.ID = :userID OR team2members.ID = :userID", { userID: user.ID });
    else if (isReferee(filter as referee))
        matchupsQ.andWhere("referee.ID IS NULL");
    else if (isStreamer(filter as streamer))
        matchupsQ.andWhere("streamer.ID IS NULL");
    else if (isCommentator(filter as commentator))
        matchupsQ.andWhere("streamer.ID IS NOT NULL AND commentators.ID IS NULL");

    const matchups = await matchupsQ.getMany();

    if (matchups.length === 0) {
        await respond(m, `No matchups found${filter === "assigned" ? " with u as a ref streamer or comm" : filter === "unassigned" ? " that r unassigned" : filter === "team" ? " with u as a team member/manager" : ""}`);
        return;
    }
    
    matchups.sort((a, b) => a.date.getTime() - b.date.getTime());

    const embed = new EmbedBuilder()
        .setTitle("Matchups")
        .setDescription(`Here are the current matchups${filter === "assigned" ? " with u as a ref streamer or comm" : filter === "unassigned" ? " that r unassigned" : filter === "team" ? " with u as a team member/manager" : ""}`)
        .setTimestamp(new Date())
        .setFields();

    let replied = false;
    for (const matchup of matchups) {
        const team1 = matchup.team1 ? `${matchup.team1.name} (${matchup.team1.abbreviation})` : "TBD";
        const team2 = matchup.team2 ? `${matchup.team2.name} (${matchup.team2.abbreviation})` : "TBD";
        const referee = matchup.referee?.osu.username ? `**${matchup.referee.osu.username}**` : "";
        const streamer = matchup.streamer?.osu.username ? `**${matchup.streamer.osu.username}**` : "";
        const commentators = matchup.commentators && matchup.commentators.length > 0 ? `**${matchup.commentators.map(c => c.osu.username).join("**, **")}**` : "";
        const value = `${matchup.date.toUTCString()}\n${discordStringTimestamp(matchup.date)}\n\nReferee: ${referee}\nStreamer: ${streamer}\nCommentators: ${commentators}`;
        if (value.length > 0)
            embed.addFields(
                {
                    name: `**${matchup.ID} (${matchup.stage!.abbreviation.toUpperCase()}):** **${team1}** vs **${team2}**\n`,
                    value,
                    inline: true,
                }
            );

        if (embed.data.fields!.length !== 25)
            continue;

        if (!replied) {
            await respond(m, undefined, [embed]);
            replied = true;
        } else
            await (m.channel as TextChannel).send({ embeds: [embed] });
        embed.data.fields = [];
    }

    if (!replied || embed.data.fields!.length > 0) {
        if (embed.data.fields!.length === 0)
            embed.addFields({ name: "No Matchups Found", value: "No matchups found with the given parameters GJ ."});
        
        replied ? await respond(m, undefined, [embed]) : await m.channel?.send({ embeds: [embed] });
    }
}

const data = new SlashCommandBuilder()
    .setName("matchup_list")
    .setDescription("List future matchups with the given parameters.")
    .addStringOption(option =>
        option.setName("filter")
            .setDescription("The filter to use.")
            .addChoices({
                name: "All",
                value: "all",
            }, {
                name: "Your/Someone's Assignments",
                value: "assigned",
            }, {
                name: "Unassigned Refs Matchups",
                value: "referee",
            }, {
                name: "Unassigned Streamers Matchups",
                value: "streamer",
            }, {
                name: "Unassigned Commentators Matchups",
                value: "commentator",
            }, {
                name: "Unassigned Matchups",
                value: "unassigned",
            }, {
                name: "Your Team's Matchups",
                value: "team",
            })
            .setRequired(true))
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The user to see assignments of.")
            .setRequired(false))
    .addStringOption(option =>
        option.setName("tournament")
            .setDescription("The tournament to see matchups from.")
            .setRequired(false));

interface parameters {
    filter: filter;
    tournament?: string;
    user?: string;
}

const matchupList: Command = {
    data,
    alternativeNames: [ "list_matchup", "list-matchup", "matchup-list", "matchuplist", "listmatchup", "listm", "mlist", "matchup_l", "l_matchup", "l-matchup", "matchup-l", "matchupl", "lmatchup", "lm", "ml" ],
    category: "tournaments",
    subCategory: "matchups",
    run,
};

export default matchupList;
