import { Message } from "discord.js";
import { User } from "../../../Models/user";
import { Command } from "../index";

async function command (m: Message) {
    const user = await User.findOne({
        discord: {
            userID: m.author.id,
        },
    });
    if (!user) {
        await m.channel.send("No user found in the corsace database for you! Please login to https://corsace.io with your discord and osu! accounts!");
        return;
    }
    m.channel.send(`Hello there ${user.osu.username}`);
}

const osu: Command = {
    name: /osu/i, 
    description: "Obtain your username from osu!",
    usage: "!osu", 
    command,
};

export default osu;