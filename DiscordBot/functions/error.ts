import {  Message, ChatInputCommandInteraction, DiscordAPIError } from "discord.js"
import respond from "./respond";

export default function errorHandler(err: unknown, m?: Message | ChatInputCommandInteraction) {
    if (!err)
        return false;

    if (!m) {
        if (!(err instanceof DiscordAPIError))
            console.log(err);
        return;
    }

    if (err instanceof DiscordAPIError) {
        respond(m, `The command was unable to be fulfilled.\nA discord error (code \`${err.code}\`) was received:\n\`\`\`\n${err.message}\n\`\`\``);
        return true;
    }

    console.log(err);
    respond(m, "The command was unable to be fulfilled.\nAn error unrelated to discord occurred while executing this command. Contact VINXIS.");
    return true;
}