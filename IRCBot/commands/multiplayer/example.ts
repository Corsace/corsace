import { BanchoMessage } from "bancho.js";
import { Command } from "../index";
import { Multi } from "nodesu";

async function run(message: BanchoMessage, multi: Multi, ...args: string[]) {
    await message.user.sendMessage(`Invoked example multi command in multi ID ${multi.match.id}!`);
}

const exampleMulti: Command = {
    name: "example_multi",
    aliases: ["test_multi"],
    multiplayerCommand: true,
    run
};

export default exampleMulti;
