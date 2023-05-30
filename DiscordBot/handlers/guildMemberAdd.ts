import { EmbedBuilder, EmbedData, GuildMember, TextChannel } from "discord.js";
import { config } from "node-config-ts";
import { User } from "../../Models/user";
import { discordClient } from "../../Server/discord";

export default async function guildMemberAdd (member: GuildMember) {

    // If this is a user joining the corsace server, add the streamannouncements and verified role as applicable
    if (member.guild.id === config.discord.guild) {
        const roles = [config.discord.roles.corsace.streamAnnouncements];
        const user = await User.findOne({
            where: {
                discord: {
                    userID: member.id,
                },
            },
        });
        if (user)
            roles.push(config.discord.roles.corsace.verified);
        else
            member.send("Hello and welcome to Corsace.\n\nIf u wanna type in the discord server, make sure u log in on osu! and then discord at https://corsace.io to obtain the `Verified` role. That will give u typing abilities");

        await member.roles.add(roles);

        const memberUser = member.user;
        const embed = new EmbedBuilder({
            title: `${memberUser.tag} joined`,
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
                    value: user ? `${memberUser.tag} is registered` : `${memberUser.tag} isn't registered`,
                },
            ],
        } as EmbedData);

        const channel = (await discordClient.channels.fetch(config.discord.logChannel))!;
        (channel as TextChannel).send({
            embeds: [embed],
        });
    }
}