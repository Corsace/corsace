import { handleCommand } from "./commands";
import { Multi } from "nodesu";
import { banchoClient } from "../Server/osu";

const self = banchoClient.getSelf();

banchoClient.on("connected", () => {
    console.log(`osu! Bancho Bot connected as ${self.ircUsername}`);
});

banchoClient.on("PM", async (message) => {
    // ignore messages from our own user
    if (message.self)
        return;

    // all commands will be prefixed with !
    if (message.message.startsWith("!")) {
        const commandName = message.message.substring(1);
        const args = message.message.split(" ");

        // remove !command from args
        args.shift();

        await handleCommand(commandName, message, ...args);
    }
});

banchoClient.on("CM", async (message) => {
    // ignore messages from our own user
    if (message.self)
        return;

    // ignore non-multiplayer channels
    if (!message.channel.name.startsWith("#mp_"))
        return;

    // all commands will be prefixed with !
    if (!message.message.startsWith("!"))
        return;

    const commandName = message.message.substring(1);
    const args = message.message.split(" ");

    // remove !command from args
    args.shift();

    const multiId = parseInt(message.channel.name.substring("#mp_".length));
    const multiplayer = await banchoClient.osuApi.multi.getMatch(multiId) as Multi;

    await handleCommand(commandName, message, multiplayer, ...args);
});
