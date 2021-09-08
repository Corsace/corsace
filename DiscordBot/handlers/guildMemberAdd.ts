import { GuildMember, MessageEmbed, MessageEmbedOptions, TextChannel } from "discord.js";
import { config } from "node-config-ts";
import { User } from "../../Models/user";
import { discordClient } from "../../Server/discord";

export default async function guildMemberAdd (member: GuildMember) {
    console.log(member);

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

        const memberUser = member.user;
        const embedMsg: MessageEmbedOptions = {
            title: `${memberUser.tag} joined!`,
            description: `Users currently in server: ${member.guild.memberCount}`,
            color: 3066993,
            timestamp: new Date(),
            footer: {
                iconURL: member.guild.iconURL() ?? undefined,
                text: "Corsace Logger",
            },
            thumbnail: {
                url: memberUser.avatarURL() ?? undefined,
            },
            fields: [
                {
                    name: "Registered?",
                    value: user ? `${memberUser.tag} is registered!` : `${memberUser.tag} is not registered!`,
                },
            ],
        };

        const message = new MessageEmbed(embedMsg);
        const channel = await discordClient.channels.fetch(config.discord.logChannel);
        (channel as TextChannel).send(message);
    }
}