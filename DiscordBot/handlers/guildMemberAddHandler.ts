import { GuildMember } from "discord.js";
import { config } from "node-config-ts";
import { User } from "../../Models/user";

export default async function guildMemberAdd (member: GuildMember) {
    // If this is a user joining the corsace server, add the streamannouncements and verified role as applicable
    if (member.guild.id === config.discord.guild) {
        const roles = [config.discord.roles.corsace.streamAnnouncements];
        const user = await User.findOne({
            discord: {
                userID: member.id,
            },
        });
        if (user)
            roles.push(config.discord.roles.corsace.verified);

        await member.roles.add(roles);
    }
}