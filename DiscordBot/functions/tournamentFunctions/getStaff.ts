import { ChatInputCommandInteraction, GuildMember, Message, User as DiscordUser } from "discord.js";
import { Tournament } from "../../../Models/tournaments/tournament";
import { TournamentRole, TournamentRoleType } from "../../../Models/tournaments/tournamentRole";
import { User } from "../../../Models/user";
import { discordClient } from "../../../Server/discord";
import getUser from "../dbFunctions/getUser";
import respond from "../respond";

export default async function getStaff (m: Message | ChatInputCommandInteraction, tournament: Tournament, target: string, targetRoles: TournamentRoleType[]): Promise<User | undefined> {
    let discordUser: DiscordUser | GuildMember;
    if (m instanceof ChatInputCommandInteraction)
        discordUser = m.options.getUser("user")!;
    else if (m.mentions.members && m.mentions.members.first())
        discordUser = m.mentions.members.first()!;
    else {
        const members = await m.guild!.members.fetch({ query: target });
        const member = members.first();
        if (!member) {
            m.reply(`Could not find user \`${target}\` in the server. Contact a Corsace admin if the problem persists.`);
            return;
        }
        discordUser = member;
    }

    const tournamentServer = discordClient.guilds.cache.get(tournament.server);
    if (!tournamentServer) {
        await respond(m, "Could not find the tournament's discord server. Please try again, or contact a Corsace admin if the problem persists.");
        return;
    }

    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const roleFilter = roles.filter(role => targetRoles.some(t => t === role.roleType));
    if (roleFilter.length === 0) {
        await respond(m, `Could not find any ${targetRoles.map(t => t.toString()).join("/")} roles. Please contact a Corsace admin.`);
        return;
    }

    const discordMember = await tournamentServer.members.fetch(discordUser);
    if (!roleFilter.some(role => discordMember.roles.cache.has(role.roleID))) {
        await respond(m, `User does not have any ${targetRoles.map(t => t.toString()).join("/")} roles.`);
        return;
    }

    const user = await getUser(discordUser.id, "discord", false);
    if (!user) {
        await respond(m, `Could not find discord user ${discordUser.toString()} in database. Please ensure that they have logged into Corsace.`);
        return;
    }

    return user;
}