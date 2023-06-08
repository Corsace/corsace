import { User } from "../../../Models/user";

export default async function getUser (ID: number | string, IDType: "osu" | "discord", save: boolean) {
    let user = await User.findOne({ where: { [IDType]: { userID: ID.toString() } }});
    if (user)
        return user;
    if (!save)
        return;

    user = new User;
    user[IDType].userID = ID.toString();
    user = await user.save();
    return user;
}
