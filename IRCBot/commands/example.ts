import { BanchoMessage } from "bancho.js";
import { Command } from "./index";

async function run (message: BanchoMessage, ...args: string[]) {
    await message.user.sendMessage("Invoked example command!");
}

const example: Command = {
    name: "example",
    aliases: ["test"],
    multiplayerCommand: false,
    run,
};

export default example;
