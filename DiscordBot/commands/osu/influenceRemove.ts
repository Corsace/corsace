import { Message } from "discord.js";
import { User } from "../../../Models/user";
import { Command } from "../index";
import { User as APIUser } from "nodesu";
import { osuClient } from "../../../Server/osu";
import { Influence } from "../../../Models/MCA_AYIM/influence";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";

async function command (m: Message) {
    const influenceRemoveRegex = /(inf|influence)del(ete)?\s+(.+)/i;
    const profileRegex = /(osu|old)\.ppy\.sh\/(u|users)\/(\S+)/i;

    if (!influenceRemoveRegex.test(m.content)) {
        await m.channel.send("Please provide a year and user!");
        return;
    }

    const user = await User.findOne({
        discord: {
            userID: m.author.id,
        },
    });
    if (!user) {
        await m.channel.send("No user found in the corsace database for you! Please login to https://corsace.io with your discord and osu! accounts!");
        return;
    }

    // Get year and/or search query params
    const res = influenceRemoveRegex.exec(m.content);
    if (!res)
        return;
    const params = res[3].split(" ");
    let year = "";
    let search = "";
    if (/^20[0-9]{2}$/.test(params[0])) {
        year = params[0];
        search = params.slice(1).join(" ");
    } else if (/^20[0-9]{2}$/.test(params[params.length - 1])) {
        year = params[params.length - 1];
        params.pop();
        search = params.join(" ");
    } else {
        await m.channel.send(`Could not parse any year provided!`);
        return;
    }

    const mca = await MCA.findOne({
        results: MoreThanOrEqual(new Date()),
        nomination: {
            start: LessThanOrEqual(new Date()),
        },
    });
    if (parseInt(year, 10) < (mca ? mca.year : (new Date()).getUTCFullYear())) {
        await m.channel.send(`You cannot remove influences for previous years!`);
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
        await m.channel.send(`No user found for **${q}**`);
        return;
    }

    const influenceUser = await User.findOne({
        osu: { 
            userID: apiUser.userId.toString(), 
        },
    });

    if (!influenceUser) {
        await m.channel.send(`**${apiUser.username}** doesn't even exist in the Corsace database! You're capping!!!!!!!`);
        return;
    }
    const influence = await Influence.findOne({
        user,
        influence: influenceUser,
        year: parseInt(year, 10),
    });
    if (!influence) {
        await m.channel.send(`**${influenceUser.osu.username}** influencing you in **${year}** doesn't seem to exist currently!`);
        return;
    }

    await influence.remove();
    m.channel.send(`**${influenceUser.osu.username}** influencing you for **${year}** has been removed!`);
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