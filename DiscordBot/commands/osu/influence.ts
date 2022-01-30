import { Message } from "discord.js";
import { User } from "../../../Models/user";
import { Command } from "../index";

async function command (m: Message) {
    const influenceRegex = /(inf|influence|influences)\s+(.+)/i;

    // No params so just get the latest influences for the user who called the command
    if (!influenceRegex.test(m.content)) {
        const user = await User
            .createQueryBuilder("user")
            .leftJoin("user.otherNames", "otherName")
            .leftJoinAndSelect("user.influences", "influence", "influence.userID = user.ID")
            .leftJoinAndSelect("influence.influence", "influenceUser")
            .where("user.discordUserid = :id", { id: m.author.id })
            .orderBy("influence.year", "DESC")
            .getOne();
        if (!user) {
            await m.channel.send("No user found in the corsace database for you! Please login to https://corsace.io with your discord and osu! accounts!");
            return;
        }
        const latestYear = Math.max(...user.influences.map(inf => inf.year));
        const influences = user.influences.filter(inf => inf.year === latestYear);
        m.channel.send(`Mapping influences for **${user.osu.username} (${latestYear}):**\n${influences.map((inf, i) => `${i + 1}: **${inf.influence.osu.username}**`).join("\n")}`);
        return;
    }

    // Get year and/or search query params
    const res = influenceRegex.exec(m.content);
    if (!res)
        return;
    const params = res[2].split(" ");
    let year = "";
    let search = "";
    if (/^20[0-9]{2}$/.test(params[0])) {
        year = params[0];
        search = params.slice(1).join(" ");
    } else if (/^20[0-9]{2}$/.test(params[params.length - 1])) {
        year = params[params.length - 1];
        params.pop();
        search = params.join(" ");
    } else
        search = res[2];

    let query = await User
        .createQueryBuilder("user")
        .leftJoin("user.otherNames", "otherName")
        .leftJoinAndSelect("user.influences", "influence")
        .leftJoinAndSelect("influence.influence", "influenceUser")
        .where("influence.userID = user.ID");
    if (year)
        query = query.andWhere("influence.year <= :year", { year });
    if (search)
        query = query.andWhere("user.osuUserid = :search", { search })
            .orWhere("user.osuUsername LIKE :user")
            .orWhere("otherName.name LIKE :user");
    
    const user = await query.orderBy("influence.year", "DESC")
        .setParameter("user", `%${search}%`)
        .getOne();
    if (!user) {
        await m.channel.send("No user containing influences found in the corsace database with the given year and query!");
        return;
    }
    const latestYear = Math.max(...user.influences.map(inf => inf.year));
    const influences = user.influences.filter(inf => inf.year === latestYear);
    m.channel.send(`Mapping influences for **${user.osu.username} (${latestYear}):**\n${influences.map((inf, i) => `${i + 1}: **${inf.influence.osu.username}**`).join("\n")}`);
    return;
    
}

const influence: Command = {
    name: ["inf", "influence", "influences"], 
    description: "Show your mapping influences or someone else's given a username and a year",
    usage: "!(inf|influence|influences)", 
    category: "osu",
    command,
};

export default influence;