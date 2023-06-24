import { handleCommand } from "./commands";
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