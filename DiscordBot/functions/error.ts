import {  Message, ChatInputCommandInteraction, DiscordAPIError } from "discord.js";
import commandUser from "./commandUser";
import respond from "./respond";

export default async function errorHandler (err: unknown, m?: Message | ChatInputCommandInteraction): Promise<boolean> {
    if (!err)
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
    respond(m, "The command was unable to be fulfilled.\nAn error unrelated to discord occurred while executing this command. Contact VINXIS");
    return true;
}