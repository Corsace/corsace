import { BanchoMessage } from "bancho.js";
import example from "./example";

interface Command {
    name: string;
    aliases?: string[];
    run: (message: BanchoMessage, ...args: string[]) => Promise<void>;
}

const commands: Command[] = [];

// all commands
commands.push(example);

async function handleCommand(commandName: string, message: BanchoMessage, ...args: string[]) {
    const command = commands.find(
        (cmd) => cmd.name == commandName.toLowerCase()
            || cmd.aliases?.includes(commandName.toLowerCase())
    );

    if (command) {
        await command.run(message, ...args);
        console.log(`${message.user.ircUsername} executed command ${command.name}`);
    }
}

export { Command, handleCommand };
