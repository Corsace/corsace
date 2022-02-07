import { Message } from "discord.js";
import { User } from "../../../Models/user";
import { Command } from "../index";
import { User as APIUser } from "nodesu";
import { osuClient } from "../../../Server/osu";
import { Influence } from "../../../Models/MCA_AYIM/influence";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";

async function command (m: Message) {
    const influenceRemoveRegex = /(inf|influence)del(ete)?\s+(.+)/i;
    const profileRegex = /(osu|old)\.ppy\.sh\/(u|users)\/(\S+)/i;
    const modeRegex = /-(standard|std|taiko|tko|catch|ctb|mania|man|storyboard|sb)/i;

    if (!influenceRemoveRegex.test(m.content)) {
        await m.reply("Please provide a year and user it's not that hard!!!!!");
        return;
    }

    const user = await User.findOne({
        discord: {
            userID: m.author.id,
        },
    });
    if (!user) {
        await m.reply("No user found in the corsace database for you! Please login to https://corsace.io with your discord and osu! accounts!");
        return;
    }

    // Get year and/or search query params
    const res = influenceRemoveRegex.exec(m.content);
    if (!res)
        return;
    const params = res[3].split(" ");
    let year = 0;
    let search = "";
    let mode: ModeDivision | undefined = undefined;
    for (const param of params) {
        if (/^20[0-9]{2}$/.test(param))
            year = parseInt(param, 10);
        if (year !== 0) {
            search = params.filter(p => p !== param).join(" ");
            break;
        }
    }
    if (year === 0) {
        year = (new Date).getUTCFullYear();
        search = params.join(" ");
    }
    for (const param of params) {
        if (modeRegex.test(param)) {
            switch (modeRegex.exec(param)![1]) {
                case "standard" || "std": {
                    mode = await ModeDivision.findOne(1);
                    break;
                } case "taiko" || "tko": {
                    mode = await ModeDivision.findOne(2);
                    break;
                } case "catch" || "ctb": {
                    mode = await ModeDivision.findOne(3);
                    break;
                } case "mania" || "man": {
                    mode = await ModeDivision.findOne(4);
                    break;
                } case "storyboard" || "sb": {
                    mode = await ModeDivision.findOne(5);
                    break;
                }
            }
            if (mode) {
                search = params.filter(p => p !== param).join(" ");
                break;
            }
        }
    }
    if (!mode)
        mode = await ModeDivision.findOne(1);

    const mca = await MCA.findOne({
        results: MoreThanOrEqual(new Date()),
        nomination: {
            start: LessThanOrEqual(new Date()),
        },
    });
    if (year < (mca ? mca.year : (new Date()).getUTCFullYear())) {
        await m.reply(`You cannot remove mapping influences for previous years!`);
        return;
    }

    // Find user
    let q = search;
    let apiUser: APIUser;
    if (profileRegex.test(search)) { // Profile linked
        const res = profileRegex.exec(m.content);
        if (!res)
            return;
        q = res[3];
        apiUser = (await osuClient.user.get(res[3])) as APIUser;
    } else
        apiUser = (await osuClient.user.get(search)) as APIUser;

    if (!apiUser) {
        await m.reply(`No user found for **${q}**`);
        return;
    }

    const influenceUser = await User.findOne({
        osu: { 
            userID: apiUser.userId.toString(), 
        },
    });

    if (!influenceUser) {
        await m.reply(`**${apiUser.username}** doesn't even exist in the Corsace database! You're capping!!!!!!!`);
        return;
    }
    const influence = await Influence.findOne({
        user,
        influence: influenceUser,
        year,
        mode,
    });
    if (!influence) {
        await m.reply(`**${influenceUser.osu.username}** influencing you as a mapper for **${year}** in **${mode!.name}** doesn't seem to exist currently!`);
        return;
    }

    await influence.remove();
    m.reply(`**${influenceUser.osu.username}** influencing you as a mapper for **${year}** in **${mode!.name}** has been removed!`);
    return;
    
}

const influenceRemove: Command = {
    name: ["infdel", "infdelete", "influencedel", "influencedelete"], 
    description: "Allows you to delete a mapper influence.",
    usage: "!(inf|influence)del(ete)", 
    category: "osu",
    command,
};

export default influenceRemove;