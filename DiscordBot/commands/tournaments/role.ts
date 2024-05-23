import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import { securityChecks } from "../../functions/tournamentFunctions/securityChecks";
import { TournamentRole } from "../../../Models/tournaments/tournamentRole";
import getUser from "../../../Server/functions/get/getUser";
import commandUser from "../../functions/commandUser";
import { loginResponse } from "../../functions/loginResponse";
import { extractParameters } from "../../functions/parameterFunctions";
import respond from "../../functions/respond";
import getTournament from "../../functions/tournamentFunctions/getTournament";
import channelID from "../../functions/channelID";
import { unFinishedTournaments } from "../../../Models/tournaments/tournament";
import confirmCommand from "../../functions/confirmCommand";
import { TournamentRoleType } from "../../../Interfaces/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, true, [], [TournamentRoleType.Organizer]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const params = await extractParameters<parameters>(m, [
        { name: "role", paramType: "role" },
        { name: "remove", shortName: "r", paramType: "boolean", optional: true },
        { name: "role_type", paramType: "string", optional: true },
    ]);
    if (!params) 
        return;

    const { role, remove, role_type } = params;

    if (!remove && !role_type) {
        await respond(m, "Listen ur either gonna have to tell me to remove a role, or ur gonna have to specify the role type u want to add\n\nThe list of role types are:\nParticipants (participants)\nStaff (staff)\nManagers (managers)\nMappoolers (mappoolers)\nMappers (mappers)\nTestplayers (testplayers)\nReferees (referees)\nStreamers (streamers)\nCommentators (commentators)\n\nExample: `!tournament_role @Tournament Staff`");
        return;
    }

    const discordRole = m.guild!.roles.cache.get(role);
    if (!discordRole) {
        await respond(m, `Can't find a role with the ID \`${role}\` <@&${role}>`);
        return;
    }

    const tournament = await getTournament(m, channelID(m), "channel", unFinishedTournaments);
    if (!tournament)
        return;

    const tournamentRoles = await TournamentRole
        .createQueryBuilder("tournamentRole")
        .leftJoinAndSelect("tournamentRole.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: tournament.ID })
        .getMany();

    // Removing the role
    if (remove) {
        if (tournamentRoles.length === 1) {
            await respond(m, "U can't remove the last tournament channel Lol");
            return;
        }

        const tournamentRole = tournamentRoles.find(tournamentRole => tournamentRole.roleID === role);
        if (!tournamentRole) {
            await respond(m, `This role is already not a tournament role for ${tournament.name}`);
            return;
        }

        if (!await confirmCommand(m, `U sure u wanna remove ${discordRole.name} from ${tournament.name}?`)) {
            await respond(m, "K ,");
            return;
        }

        await tournamentRole.remove();
        await respond(m, `Removed ${discordRole.name} from ${tournament.name}, it was a \`${TournamentRoleType[tournamentRole.roleType]}\` role`);
        return;
    }

    // Adding the role
    if (!role_type) {
        await respond(m, "This should never happen. Contact VINXIS and tell him everything u did and the command u just used");
        return;
    }

    const roleType = role_type.toLowerCase().charAt(0).toUpperCase() + role_type.toLowerCase().slice(1);
    if (!(roleType in TournamentRoleType)) {
        await respond(m, `Invalid role type \`${role_type}\` (Valid role types are: Participants, Staff, Managers, Mappoolers, Mappers, Testplayers, Referees, Streamers, Commentators, Designers, Developers)`);
        return;
    }

    let tournamentRole = tournamentRoles.find(tournamentRole => tournamentRole.roleID === role);
    if (tournamentRole) {
        await respond(m, `This role's already a tournament role for ${tournament.name}, it's a \`${TournamentRoleType[tournamentRole.roleType]}\` role`);
        return;
    }

    if (!await confirmCommand(m, `U sure u wanna add ${discordRole.name} to ${tournament.name} as a \`${roleType}\` role?`)) {
        await respond(m, "K ,");
        return;
    }

    tournamentRole = new TournamentRole();
    tournamentRole.createdBy = user;
    tournamentRole.roleID = discordRole.id;
    tournamentRole.roleType = TournamentRoleType[roleType as keyof typeof TournamentRoleType];
    tournamentRole.tournament = tournament;
    await tournamentRole.save();
    await respond(m, `Added ${discordRole.name} to ${tournament.name} as a \`${roleType}\` role`);
    return;
}

const data = new SlashCommandBuilder()
    .setName("tournament_role")
    .setDescription("Let's you add/remove a tournament role to/from a tournament")
    .addRoleOption(option =>
        option.setName("role")
            .setDescription("The role to add/remove")
            .setRequired(true))
    .addBooleanOption(option =>
        option.setName("remove")
            .setDescription("Whether to remove the role instead of adding it")
            .setRequired(false))
    .addStringOption(option =>
        option.setName("role_type")
            .setDescription("The type of role to add (Does nothing if removing)")
            .setRequired(false)
            .addChoices({
                name: "Participants",
                value: "Participants",
            },
            {
                name: "Staff",
                value: "Staff",
            },
            {
                name: "Managers",
                value: "Managers",
            },
            {
                name: "Mappoolers",
                value: "Mappoolers",
            },
            {
                name: "Mappers",
                value: "Mappers",
            },
            {
                name: "Testplayers",
                value: "Testplayers",
            },
            {
                name: "Referees",
                value: "Referees",
            },
            {
                name: "Streamers",
                value: "Streamers",
            },
            {
                name: "Commentators",
                value: "Commentators",
            },
            {
                name: "Designer",
                value: "Designer",
            },
            {
                name: "Developer",
                value: "Developer",
            }))
    .setDMPermission(false);

interface parameters {
    role: string,
    remove?: string,
    role_type?: string,
}

const tournamentRole: Command = {
    data,
    alternativeNames: [ "role_tournaments", "role_tournament", "tournaments_role", "role-tournaments", "role-tournament", "tournaments-role", "tournament-role", "tournamentsrole", "tournamentrole", "roletournaments", "roletournament", "rolet", "trole", "tournamentr", "tournamentsr", "rtournament", "rtournaments" ],
    category: "tournaments",
    run,
};

export default tournamentRole;