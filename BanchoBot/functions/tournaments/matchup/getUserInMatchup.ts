import { BanchoMessage } from "bancho.js";
import { User } from "../../../../Models/user";

const bots = {
    "Corsace": "29191632",
    "BanchoBot": "3",
};

export default async function getUserInMatchup (users: User[], message: BanchoMessage): Promise<User> {
    if (!message.user || !message.user.id) {
        const id = bots[message.user?.ircUsername || "BanchoBot"];
        const botUser = users.find(user => user.osu.userID === id);
        if (botUser)
            return botUser;

        if (message.user?.ircUsername) {
            const user = await User.findOne({ where: { osu: { username: message.user?.ircUsername } } });
            if (user)
                return user;
        }

        return users.find(user => user.osu.userID === "3")!;
    }

    const user = users.find(user => user.osu.userID === message.user!.id.toString());
    if (user)
        return user;

    throw new Error("User not found");
}