import { Message } from "discord.js";
import { User } from "../../../Models/user";
import { Command } from "../index";

async function command (message: Message) {
    const user = await User.findOne({
        discord: {
            userID: message.author.id,
        },
    });
    if (!user) {
        await message.channel.send("No user found in the corsace database for you! Please login to https://corsace.io with your discord and osu! accounts!");
        return;
    }
    message.channel.send(`Hello there ${user.osu.username}`);
}

const osu: Command = {
    name: "osu", 
    description: "Obtain your username from osu!",
    usage: "!osu", 
    command,
};

export default osu;