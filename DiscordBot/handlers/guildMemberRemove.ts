import { GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { config } from "node-config-ts";
import { discordClient } from "../../Server/discord";
import { EmbedBuilder } from "../functions/embedBuilder";

export default async function guildMemberRemove (member: GuildMember | PartialGuildMember) {

    // If this is a user joining the corsace server, add the streamannouncements and verified role as applicable
    const user = await discordClient.users.fetch(member.id);
    if (member.guild.id === config.discord.guild) {
        const embed = new EmbedBuilder()
            .setTitle(`${user ? user.username : "A user"} left`)
            .setDescription(`Users currently in server: ${member.guild.memberCount}`)
            .setColor(15277667)
            .setTimestamp()
            .setFooter({ text: "Corsace Logger", icon_url: member.guild.iconURL() ?? undefined })
            .setThumbnail(user?.avatarURL() ?? "");

        const channel = await discordClient.channels.fetch(config.discord.logChannel);
        await (channel as TextChannel).send({
            embeds: embed.build(),
        });
    }
}