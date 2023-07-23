import { ChannelMessage, PrivateMessage } from "bancho.js";
import { Command } from "./index";

async function run (message: PrivateMessage | ChannelMessage) {
    await message.user.sendMessage("Invoked example command!");
}

const example: Command = {
    name: "example",
    aliases: ["test"],
    run,
};

export default example;
