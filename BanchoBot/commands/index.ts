import { BanchoMessage } from "bancho.js";
import { Multi } from "nodesu";

import example from "./example";

import exampleMulti from "./multiplayer/example";
import panic from "./multiplayer/panic";

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

/// all commands

// general commands
commands.push(example);

// multiplayer commands
commands.push(exampleMulti);
commands.push(panic);

function handleCommand(
    commandName: string,
    message: BanchoMessage,
    ...args: string[]
): Promise<void>;

function handleCommand(
    commandName: string,
    message: BanchoMessage,
    multi: Multi,
    ...args: string[]
): Promise<void>;

async function handleCommand (commandName: string, message: BanchoMessage, multiOrArg?: Multi | string, ...args: string[]) {
    const command = commands.find(
        (cmd) => cmd.name == commandName.toLowerCase()
            || cmd.aliases?.includes(commandName.toLowerCase())
    );

    if (!command)
        return;

    if (command.multiplayerCommand) {
        if (!(multiOrArg instanceof Multi)) {
            console.error("Invoked multiplayer command without a multi match");
            return;
        }

        await command.run(message, multiOrArg, ...args);
    } else {
        const allArgs = multiOrArg ? [multiOrArg as string, ...args] : args;
        await command.run(message, ...allArgs);
    }

    console.log(`${message.user.ircUsername} executed command ${command.name}`);
}

export { Command, handleCommand };
