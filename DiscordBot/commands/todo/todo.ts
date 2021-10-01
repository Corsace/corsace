import { Message } from "discord.js";
import { Command } from "../index";

async function command (m: Message) {
    m.member.roles.resolve()

    m.channel.send();
}

const todo: Command = {
    name: ["todo"], 
    description: "Obtain your or someone else's most recent (top) score",
    usage: "!(r|recent|rs|rb|recentb|recentbest)", 
    command,
};

export default todo;