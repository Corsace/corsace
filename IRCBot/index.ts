import { BanchoClient } from "bancho.js";
import { config } from "node-config-ts";
import { handleCommand } from "./commands";

const banchoClient = new BanchoClient({ username: config.osu.irc.username, password: config.osu.irc.ircPassword, botAccount: config.osu.irc.botAccount });

async function main() {
    await banchoClient.connect();

    const self = banchoClient.getSelf();
    console.log(`osu! IRC Bot connected as ${self.ircUsername}`);

    banchoClient.on("PM", async (message) => {
        // ignore PMs from our own user
        if (message.self)
            return;

        // all commands will be prefixed with !
        if (message.message.startsWith("!")) {
            const commandName = message.message.substring(1);
            const args = message.message.split(" ");

            // remove !command from args
            args.shift();

            await handleCommand(commandName, message, ...args)
        }
    });
}

main();
