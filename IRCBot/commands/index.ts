import { BanchoMessage } from "bancho.js";
import example from "./example";
import exampleMulti from "./multiplayer/example";
import { Multi } from "nodesu";

interface GlobalCommand {
    name: string;
    aliases?: string[];
    multiplayerCommand: false;
    run: (message: BanchoMessage, ...args: string[]) => Promise<void>;
}

interface MultiplayerCommand {
    name: string;
    aliases?: string[];
    multiplayerCommand: true;
    run: (message: BanchoMessage, multi: Multi, ...args: string[]) => Promise<void>;
}

type Command = GlobalCommand | MultiplayerCommand;

const commands: Command[] = [];

// all commands
commands.push(example);
commands.push(exampleMulti);

async function handleGlobalCommand(commandName: string, message: BanchoMessage, ...args: string[]) {
    const command = commands.find(
        (cmd) => (cmd.name == commandName.toLowerCase()
            || cmd.aliases?.includes(commandName.toLowerCase()) && !cmd.multiplayerCommand)
    ) as GlobalCommand | undefined;

    if (!command)
        return;

    await command.run(message, ...args);
    console.log(`${message.user.ircUsername} executed command ${command.name}`);
}

async function handleMultiplayerCommand(commandName: string, message: BanchoMessage, multi: Multi, ...args: string[]) {
    const command = commands.find(
        (cmd) => cmd.name == commandName.toLowerCase()
            || cmd.aliases?.includes(commandName.toLowerCase())
    );

    if (!command)
        return;

    if (command.multiplayerCommand) {
        await command.run(message, multi, ...args);
    } else {
        await command.run(message, ...args);
    }

    console.log(`${message.user.ircUsername} executed multiplayer command ${command.name}`);
}

export { Command, handleGlobalCommand, handleMultiplayerCommand };
