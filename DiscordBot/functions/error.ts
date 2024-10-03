import {  Message, ChatInputCommandInteraction, DiscordAPIError, TextChannel } from "discord.js";
import commandUser from "./commandUser";
import respond from "./respond";
import { discordClient } from "../../Server/discord";
import { config } from "node-config-ts";

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
    const channel = discordClient.channels.cache.get(config.discord.coreChannel);
    if (channel instanceof TextChannel)
        await channel.send(`${new Date().toISOString()}\nAn error unrelated to discord occurred while executing a discord command\nMessage/Interaction: \`${m instanceof Message ? m.content : m.commandName}\`\n\`\`\`${err}\`\`\``);
    await respond(m, "The command was unable to be fulfilled.\nAn error unrelated to discord occurred while executing this command. Contact VINXIS");
    return true;
}