import {  Message, ChatInputCommandInteraction, DiscordAPIError, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageComponentInteraction } from "discord.js";
import commandUser from "./commandUser";
import respond from "./respond";
import { discordClient } from "../../Server/discord";
import { config } from "node-config-ts";
import { randomUUID } from "crypto";
import { filter } from "./messageInteractionFunctions";

export default async function errorHandler (err: unknown, m?: Message | ChatInputCommandInteraction): Promise<boolean> {
    if (!err || !(err instanceof Error))
        return false;

    if (!m) {
        if (!(err instanceof DiscordAPIError))
            console.log(err);
        return false;
    }

    if (err instanceof DiscordAPIError) {
        if (err.code === 50027) {
            await m.channel?.send(`Ur command timed out Lol try again <@${commandUser(m).id}>`);
            if (m instanceof Message && m.deletable)
                await m.delete();
            if (m instanceof ChatInputCommandInteraction)
                await m.deleteReply();
        } else
            await respond(m, `The command was unable to be fulfilled.\nA discord error (code \`${err.code}\`) was received:\n\`\`\`\n${err.message}\n\`\`\``);
        return true;
    }

    console.error(err);
    try {
        const channel = discordClient.channels.cache.get(config.discord.coreChannel);
        if (channel instanceof TextChannel) {
            const stackID = randomUUID();
            const deleteID = randomUUID();
            const message = await channel.send({
                content: `${new Date().toISOString()}\nAn error unrelated to discord occurred while executing a discord command\nMessage/Interaction: \`${m instanceof Message ? m.content : m.commandName}\`\n\`\`\`${err}\`\`\``,
                components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(stackID)
                        .setLabel("See Stack Trace")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(deleteID)
                        .setLabel("Delete")
                        .setStyle(ButtonStyle.Danger)
                )],
            });

            const collector = message.createMessageComponentCollector({ filter, time: 6000000 });
            collector.on("collect", async (i: MessageComponentInteraction) => {	
                if (i.customId === stackID)
                    await i.update({
                        content: `${new Date().toISOString()}\nAn error unrelated to discord occurred while executing a discord command\nMessage/Interaction: \`${m instanceof Message ? m.content : m.commandName}\`\n\`\`\`${err.stack}\`\`\``,
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder()
                                    .setCustomId(deleteID)
                                    .setLabel("Delete")
                                    .setStyle(ButtonStyle.Danger)
                            ),
                        ],
                    });
                if (i.customId === deleteID)
                    await message.delete();
            });
        }
        await respond(m, "The command was unable to be fulfilled.\nAn error unrelated to discord occurred while executing this command. Contact VINXIS");
    } catch (e) {
        console.error("An error occurred while handling non-discord errors", e);
    }
    return true;
}