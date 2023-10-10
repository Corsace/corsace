import { GuildMember, EmbedBuilder, EmbedData, PartialGuildMember, TextChannel } from "discord.js";
import { config } from "node-config-ts";
import { discordClient } from "../../Server/discord";

export default async function guildMemberRemove (member: GuildMember | PartialGuildMember) {

    // If this is a user joining the corsace server, add the streamannouncements and verified role as applicable
    const user = await discordClient.users.fetch(member.id);
    if (member.guild.id === config.discord.guild) {
        const embed = new EmbedBuilder({
            title: `${user ? user.username : "A user"} left`,
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
        } as EmbedData);

        const channel = await discordClient.channels.fetch(config.discord.logChannel);
        await (channel as TextChannel).send({
            embeds: [embed],
        });
    }
}