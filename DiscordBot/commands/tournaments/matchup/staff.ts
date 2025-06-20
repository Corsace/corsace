import { ChatInputCommandInteraction, GuildMemberRoleManager, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../..";
import { TournamentRoleType } from "../../../../Interfaces/tournament";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import { loginResponse } from "../../../functions/loginResponse";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { extractParameters } from "../../../functions/parameterFunctions";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import channelID from "../../../functions/channelID";
import confirmCommand from "../../../functions/confirmCommand";
import respond from "../../../functions/respond";
import { extractTargetText } from "../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import getStaff from "../../../functions/tournamentFunctions/getStaff";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";

const refValues = ["referee", "ref", "r", "referees", "refs", "rs"] as const;
const commentValues = ["commentator", "comment", "c", "commentators", "comments", "cs"] as const;
const streamValues = ["streamer", "stream", "s", "streamers", "streams", "ss"] as const;

type referee = typeof refValues[number];
type commentator = typeof commentValues[number];
type streamer = typeof streamValues[number];
type staffType = referee | commentator | streamer;

function isReferee (type: referee): boolean {
    return refValues.includes(type);
}

function isCommentator (type: commentator): boolean {
    return commentValues.includes(type);
}

function isStreamer (type: streamer): boolean {
    return streamValues.includes(type);
}

function getStaffProperty (type: staffType): "referee" | "streamer" | "commentators" {
    if (isReferee(type as referee)) return "referee";
    if (isStreamer(type as streamer)) return "streamer";
    return "commentators";
}

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Referees, TournamentRoleType.Streamers, TournamentRoleType.Commentators]))
        return;

    let user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const tournament = await getTournament(m, channelID(m), "channel", undefined, true);
    if (!tournament)
        return;

    const params = await extractParameters<parameters>(m, [
        { name: "matchup", paramType: "string" },
        { name: "staff_type", paramType: "string", optional: true },
        { name: "user", paramType: "string", customHandler: extractTargetText, optional: true },
    ]); 
    if (!params)
        return;

    const { matchup: matchupID, staff_type: staffType, user: userID } = params;
    if (!(isReferee(staffType as referee) || isStreamer(staffType as streamer) || isCommentator(staffType as commentator))) {
        await respond(m, "Invalid staff type provided");
        return;
    }

    if (userID && userID !== commandUser(m).id) {
        if (!await securityChecks(m, true, false, [], [TournamentRoleType.Organizer]))
            return;

        user = await getStaff(m, tournament, userID, [TournamentRoleType.Organizer, TournamentRoleType.Referees, TournamentRoleType.Streamers, TournamentRoleType.Commentators]);
        if (!user)
            return;
    }

    if (isCommentator(staffType as commentator) && !await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Commentators]))
        return;
    if (isStreamer(staffType as streamer) && !await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Streamers]))
        return;
    if (isReferee(staffType as referee) && !await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Referees]))
        return;

    const staffProperty = getStaffProperty(staffType );

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.commentators", "commentators")
        .leftJoinAndSelect("matchup.streamer", "streamer")
        .where("(matchup.ID = :matchupID OR matchup.matchID = :matchupID)", { matchupID })
        .andWhere("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .getOne();

    if (!matchup) {
        await m.reply("Invalid matchup ID provided");
        return;
    }

    if (matchup.mp) {
        await respond(m, "This matchup has already been played");
        return;
    }

    // Ref or streamer (those are 1 person roles)
    if (staffProperty === "referee" || staffProperty === "streamer") {
        if (matchup[staffProperty]?.ID === user.ID) {
            matchup[staffProperty] = null;
            await matchup.save();
            await respond(m, `Ok \`${user.osu.username}\` isnt staffing as \`${staffProperty}\` for matchup \`${matchup.ID}\` anymore`);
            return;
        }

        if (
            matchup[staffProperty] && 
            matchup[staffProperty]!.ID !== user.ID
        ) {
            const memberRoles = m.member?.roles;
            if (!memberRoles) {
                await respond(m, "Can't fetch ur roles");
                return;
            }

            const roleIDs = memberRoles instanceof GuildMemberRoleManager ? memberRoles.cache.map(r => r.id) : memberRoles;
            if (roleIDs.length === 0) {
                await respond(m, "U don't have any roles");
                return;
            }

            const roles = await TournamentRole
                .createQueryBuilder("role")
                .where("role.roleID IN (:...roleIDs)", { roleIDs })
                .getMany();
            const bypass = roles.some(r => r.roleType === TournamentRoleType.Organizer);

            if (!bypass && !await confirmCommand(m, `<@${matchup[staffProperty]!.discord.userID}> do u allow \`${user.osu.username}\` to be the \`${staffProperty}\` for matchup \`${matchup.ID}\`?`, true, matchup[staffProperty]!.discord.userID)) {
                await respond(m, "Ok w/e .");
                return;
            }
        }
    
        matchup[staffProperty] = user;
        await matchup.save();
        await respond(m, `\`${user.osu.username}\` is now the \`${staffProperty}\` for matchup \`${matchup.ID}\``);
        return;
    }

    // Commentator (3 person role)
    if (matchup.commentators?.some(c => c.ID === user!.ID)) {
        matchup.commentators = matchup.commentators.filter(c => c.ID !== user!.ID);
        await matchup.save();
        await respond(m, `Ok \`${user.osu.username}\` isnt staffing as a commentator for matchup \`${matchup.ID}\` anymore`);
        return;
    }  

    if (matchup.commentators && matchup.commentators.length === 3) {
        await respond(m, "This matchup already has 3 commentators any more would be 2 much :/");
        return;
    }

    if (matchup.commentators)
        matchup.commentators.push(user);
    else
        matchup.commentators = [user];
    await matchup.save();
    await respond(m, `${user.osu.username} is now a commentator for matchup \`${matchup.ID}\``);
}

const data = new SlashCommandBuilder()
    .setName("matchup_staff")
    .setDescription("Assign or remove yourself (or someone else if organizer) as staff for a matchup")
    .addStringOption(option =>
        option.setName("matchup")   
            .setDescription("The ID of the matchup to assign/remove yourself as a staff")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("staff_type")
            .setDescription("The type of staff to assign yourself as")
            .setRequired(true)
            .addChoices({
                name: "Referee",
                value: "referee",
            },
            {
                name: "Streamer",
                value: "streamer",
            },
            {
                name: "Commentator",
                value: "commentator",
            }))
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The user to assign as staff (only for organizers)")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    matchup: string,
    staff_type: staffType,
    user?: string,
}

const matchupStaff: Command = {
    data,
    alternativeNames: ["staff_matchup", "staff-matchup", "matchup-staff", "matchupstaff", "staffmatchup", "staffm", "mstaff", "matchup_s", "s_matchup", "s-matchup", "matchup-s", "matchups", "smatchup", "sm", "ms"],
    category: "tournaments",
    subCategory: "matchups",
    run,
};

export default matchupStaff;
