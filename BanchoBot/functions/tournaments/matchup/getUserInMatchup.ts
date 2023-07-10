import { BanchoMessage } from "bancho.js";
import { User } from "../../../../Models/user";

const bots = {
    "Corsace": "29191632",
    "BanchoBot": "3",
};

export default async function getUserInMatchup (users: User[], message: BanchoMessage): Promise<User> {
    if (!message.user || !message.user.id) {
        const id = bots[message.user?.ircUsername || "BanchoBot"];
        return users.find(user => user.osu.userID === id)!;
    }

    const user = users.find(user => user.osu.userID === message.user!.id.toString());
    if (user)
        return user;

    throw new Error("User not found");
}