import { ChatInputCommandInteraction, GuildMemberRoleManager, Message, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { TournamentRole } from "../../../Models/tournaments/tournamentRole";
import { TournamentChannel } from "../../../Models/tournaments/tournamentChannel";
import respond from "../respond";
import channelID from "../channelID";
import { TournamentRoleType, TournamentChannelType } from "../../../Interfaces/tournament";

export async function hasTournamentRoles (m: Message | ChatInputCommandInteraction, targetRoles: TournamentRoleType[]): Promise<boolean> {
    if (targetRoles.length === 0)
        return true;

    const memberRoles = m.member?.roles;
    if (!memberRoles) {
        await respond(m, "Can't fetch ur roles");
        return false;
    }
    const roleIDs = memberRoles instanceof GuildMemberRoleManager ? memberRoles.cache.map(r => r.id) : memberRoles;

    const roles = await TournamentRole
        .createQueryBuilder("role")
        .where("role.roleID IN (:...roleIDs)", { roleIDs })
        .getMany();
    const allowedRoles = roles.filter(r => targetRoles.some(t => t === r.roleType));
    if (allowedRoles.length === 0) {
        await respond(m, `U don't have any of the following roles: ${targetRoles.map(t => TournamentRoleType[t]).join(", ")}`);
        return false;
    }

    return true;
}

export async function isSecuredChannel (m: Message | ChatInputCommandInteraction, targetChannels: TournamentChannelType[]): Promise<boolean> {
    if (targetChannels.length === 0)
        return true;

    const channel = await TournamentChannel.findOne({
        where: {
            channelID: channelID(m),
        },
    });
    if (!channel) {
        await respond(m, "This channel isn't registered as a secured channel for any tournament. If this is a mistake, have the tournament admins/organizers add this channel as a secured channel for the tournament with the applicable channel type");
        return false;
    }

    // Check if the channel type is allowed
    const allowed = targetChannels.some(t => t === channel.channelType);
    if (!allowed) {
        await respond(m, `This channel isn't any of the following channel types: ${targetChannels.map(t => TournamentChannelType[t]).join(", ")}. If this is a mistake, have the tournament admins/organizers add this channel as a secured channel for the tournament with the applicable channel type`);
        return false;
    }

    return true;
}

export async function securityChecks (m: Message | ChatInputCommandInteraction, inGuild: boolean, isAdmin: boolean, securedChannels: TournamentChannelType[], allowedRoles: TournamentRoleType[]): Promise<boolean> {
    if (inGuild && !m.guild) {
        await respond(m, "This command can only be used in a server");
        return false;
    }

    if (isAdmin && !(m.member?.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator)) {
        await respond(m, "U must have a role with administrator privileges to use this command");
        return false;
    }

    if (!await isSecuredChannel(m, securedChannels))
        return false;

    if (!await hasTournamentRoles(m, allowedRoles))
        return false;

    return true;
}