import { Message } from "discord.js";
import { User } from "../../Models/user";
import { discordClient } from "../../Server/discord";

export default async function message (message: Message) {
    console.log(message);

    // Don't respond to itself or other bots
    if (message.author.id === discordClient.user?.id || message.author.bot)
        return;

    // First super basic command
    if (message.content.startsWith("!osu")) {
        const user = await User.findOne({
            discord: {
                userID: message.author.id,
            },
        });
        if (!user) {
            await message.reply("No user found in the corsace database for you! Please login to https://corsace.io with your discord and osu! accounts!");
            return;
        }
        message.reply(`Hello there ${user.osu.username}`);
    }
}