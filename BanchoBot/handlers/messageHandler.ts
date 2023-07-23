import { ChannelMessage, PrivateMessage } from "bancho.js";
import { handleCommand } from "../commands";
import state from "../state";

export default async function messageHandler (message: PrivateMessage | ChannelMessage) {
    if (state.shuttingDown)
        return;

    // ignore messages from our own user
    if (message.self)
        return;

    // all commands will be prefixed with !
    if (message.message.startsWith("!")) {
        const commandName = message.message.split(" ")[0].substring(1);

        await handleCommand(commandName, message);
    }
}