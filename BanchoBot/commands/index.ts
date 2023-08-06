import { ChannelMessage, PrivateMessage } from "bancho.js";

// import example from "./example";

// import exampleMulti from "./multiplayer/example";

interface Command {
    name: string;
    aliases?: string[];
    run: (message: PrivateMessage | ChannelMessage) => Promise<void>;
}

const commands: Command[] = [];

/// all commands

// general commands
// commands.push(example);

// multiplayer commands
// commands.push(exampleMulti);

async function handleCommand (commandName: string, message: PrivateMessage | ChannelMessage) {
    const command = commands.find(cmd => 
        cmd.name === commandName.toLowerCase() || 
        cmd.aliases?.includes(commandName.toLowerCase())
    );

    if (!command)
        return;

    await command.run(message);

    console.log(`${message.user.ircUsername} executed command ${command.name}`);
}

export { Command, handleCommand };
