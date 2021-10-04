import { GuildMember, MessageEmbed, MessageEmbedOptions, PartialGuildMember, TextChannel } from "discord.js";
import { config } from "node-config-ts";
import { discordClient } from "../../Server/discord";

export default async function guildMemberRemove (member: GuildMember | PartialGuildMember) {

    // If this is a user joining the corsace server, add the streamannouncements and verified role as applicable
    const user = await discordClient.users.fetch(member.id);
    if (member.guild.id === config.discord.guild) {
        const embedMsg: MessageEmbedOptions = {
            title: `${user ? user.tag : "A user"} left.`,
            description: `Users currently in server: ${member.guild.memberCount}`,
            color: 15277667,
            timestamp: new Date(),
            footer: {
                icon_url: member.guild.iconURL() ?? undefined,
                text: "Corsace Logger",
            },
            thumbnail: {
                url: user?.avatarURL() ?? undefined,
            },
        };

        const message = new MessageEmbed(embedMsg);
        const channel = await discordClient.channels.fetch(config.discord.logChannel);
        (channel as TextChannel).send(message);
    }
}