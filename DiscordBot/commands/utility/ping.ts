import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";

async function run (m: Message | ChatInputCommandInteraction) {
    // Write time taken to send a message
    const start = Date.now();
    const msg = await m.reply("Pinging");
    const end = Date.now();
    await msg.edit(`Back (${end - start}ms)`);
}

const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pings the bot");

const ping: Command = {
    data,
    alternativeNames: ["p"],
    category: "utility",
    run,
};

export default ping;