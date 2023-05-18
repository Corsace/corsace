import { ChatInputCommandInteraction, GuildMemberRoleManager, Message } from "discord.js";
import { TournamentRole, TournamentRoleType } from "../../../Models/tournaments/tournamentRole";
import { TournamentChannel, TournamentChannelType } from "../../../Models/tournaments/tournamentChannel";

export async function hasTournamentRoles (m: Message | ChatInputCommandInteraction, targetRoles: TournamentRoleType[]): Promise<boolean> {
    if (targetRoles.length === 0)
        return true;

    const memberRoles = m.member?.roles;
    if (!memberRoles) {
        if (m instanceof Message) m.reply("Could not fetch your roles.");
        else m.editReply("Could not fetch your roles.");
        return false;
    }
    const roleIDs = memberRoles instanceof GuildMemberRoleManager ? memberRoles.cache.map(r => r.id) : memberRoles;

    const roles = await TournamentRole
        .createQueryBuilder("role")
        .where("role.roleID IN (:...roleIDs)", { roleIDs })
        .getMany();
    const allowedRoles = roles.filter(r => targetRoles.some(t => t === r.roleType));
    if (allowedRoles.length === 0) {
        if (m instanceof Message) m.reply(`You do not have any of the following roles: ${targetRoles.map(t => TournamentRoleType[t]).join(", ")}.`);
        else m.editReply(`You do not have any of the following roles: ${targetRoles.map(t => TournamentRoleType[t]).join(", ")}.`);
        return false;
    }

    return true;
}

export async function isSecuredChannel (m: Message | ChatInputCommandInteraction, targetChannels: TournamentChannelType[]): Promise<boolean> {
    if (targetChannels.length === 0)
        return true;

    const channel = await TournamentChannel.findOne({
        where: {
            channelID: m.channel && m.channel.isThread() ? m.channel.parentId! : m.channelId,
        },
    });
    if (!channel) {
        if (m instanceof Message) m.reply("This channel is not registered as a secured channel for any tournament. If this is a mistake, please have the tournament admins/organizers add this channel as a secured channel for the tournament with the applicable channel type.");
        else m.editReply("This channel is not registered as a secured channel for any tournament. If this is a mistake, please have the tournament admins/organizers add this channel as a secured channel for the tournament with the applicable channel type.");
        return false;
    }

    // Check if the channel type is allowed
    const allowed = targetChannels.some(t => t === channel.channelType);
    if (!allowed) {
        if (m instanceof Message) m.reply(`This channel is not any of the following channel types: ${targetChannels.map(t => TournamentChannelType[t]).join(", ")}. If this is a mistake, please have the tournament admins/organizers add this channel as a secured channel for the tournament with the applicable channel type.`);
        else m.editReply(`This channel is not any of the following channel types: ${targetChannels.map(t => TournamentChannelType[t]).join(", ")}. If this is a mistake, please have the tournament admins/organizers add this channel as a secured channel for the tournament with the applicable channel type.`);
        return false;
    }

    return true;
}

export async function securityChecks (m: Message | ChatInputCommandInteraction, inGuild: boolean, securedChannels: TournamentChannelType[], allowedRoles: TournamentRoleType[]) {
    if (inGuild && !m.guild)
        return;

    if (!(await isSecuredChannel(m, securedChannels)))
        return;

    if (!(await hasTournamentRoles(m, allowedRoles)))
        return;

    return true;
}