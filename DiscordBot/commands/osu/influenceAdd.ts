import { DiscordAPIError, Message, MessageActionRow, MessageButton } from "discord.js";
import { OAuth, User } from "../../../Models/user";
import { Command } from "../index";
import { User as APIUser } from "nodesu";
import { osuClient } from "../../../Server/osu";
import { Influence } from "../../../Models/MCA_AYIM/influence";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { isEligibleFor } from "../../../MCA-AYIM/api/middleware";

async function command (m: Message) {
    const influenceAddRegex = /(inf|influence)add\s+(.+)/i;
    const profileRegex = /(osu|old)\.ppy\.sh\/(u|users)\/(\S+)/i;
    const modeRegex = /-(standard|std|taiko|tko|catch|ctb|mania|man|storyboard|sb)/i;
    const commentRegex = /-c (.+)/i;

    if (!influenceAddRegex.test(m.content)) {
        await m.reply("Please at least provide a user come on!!!!!!");
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

    // Get year, search, mode, and/or comment params
    let comment = "";
    if (commentRegex.test(m.content)) {
        comment = commentRegex.exec(m.content)![1];
        m.content = m.content.replace(commentRegex, "").trim();
    }
    const res = influenceAddRegex.exec(m.content);
    if (!res)
        return;
    const params = res[2].split(" ");
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

    if (!isEligibleFor(user, mode!.ID, year)) {
        await m.reply(`You did not rank a set or guest difficulty this year in **${mode!.name}**!${year === (new Date).getUTCFullYear() ? "\nFor adding influences in the current year, then if you have ranked a set, re-login to Corsace with your osu! account, and you should be able to add them after!" : ""}`);
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

    let influenceUser = await User.findOne({
        osu: { 
            userID: apiUser.userId.toString(), 
        },
    });

    if (!influenceUser) {
        influenceUser = new User;
        influenceUser.country = apiUser.country.toString();
        influenceUser.osu = new OAuth;
        influenceUser.osu.userID = `${apiUser.userId}`;
        influenceUser.osu.username = apiUser.username;
        influenceUser.osu.avatar = "https://a.ppy.sh/" + apiUser.userId;
        await influenceUser.save();
    }

    const influences = await Influence.find({
        where: {
            user,
            year,
            mode,
        },
        relations: ["user", "influence"],
    });
    if (influences.length === 5) {
        await m.reply(`You already have 5 influences for **${year}** in **${mode!.name}**!`);
        return;
    } else if (influences.some(inf => inf.influence.osu.userID === influenceUser!.osu.userID)) {
        await m.reply(`You have already marked **${influenceUser.osu.username}** as a mapping influence for **${year}** in **${mode!.name}**!`);
        return;
    }

    const influence = new Influence;
    influence.user = user;
    influence.influence = influenceUser!;
    influence.year = year;
    influence.mode = mode!;
    influence.comment = comment;
    influence.rank = influences.length + 1;

    // Warn for older years
    const mca = await MCA.findOne({
        results: MoreThanOrEqual(new Date()),
        nomination: {
            start: LessThanOrEqual(new Date()),
        },
    });
    if (year < (mca ? mca.year : (new Date()).getUTCFullYear())) {
        const row = new MessageActionRow();
        row.addComponents(
            new MessageButton()
                .setCustomId("true")
                .setLabel("Yes")
                .setStyle("SUCCESS"),
            new MessageButton()
                .setCustomId("false")
                .setLabel("No")
                .setStyle("DANGER")
        );
        const message = await m.reply({
            content: `Are you sure you want to add **${influenceUser.osu.username}** as a mapping influence for **${year}** in **${mode!.name}**? You cannot remove influences for years past the currently running MCA!`,
            components: [row],
        });
        const collector = message.createMessageComponentCollector({ componentType: "BUTTON", time: 10000 });
        collector.on("collect", async (i) => {
            if (i.user.id !== m.author.id) {
                i.reply({ content: "Fack off cunt", ephemeral: true });
                return;
            }

            if (i.customId === "true") {
                await influence.save();
                m.reply(`Added **${influenceUser!.osu.username}** as a mapping influence for **${year}** in **${mode!.name}**!`);
            }
            await message.delete();
        });
        collector.on("end", async () => {
            try {
                await message.delete();
            } catch (e) {   
                if (e instanceof DiscordAPIError)
                    return;
                console.error(e);
            }
        });
        return;
    }

    await influence.save();

    m.reply(`Added **${influenceUser.osu.username}** as a mapping influence for **${year}** in **${mode!.name}**!`);
    return;
    
}

const influenceAdd: Command = {
    name: ["infadd", "influenceadd"], 
    description: "Allows you to add a mapper influence.",
    usage: "!(inf|influence)add", 
    category: "osu",
    command,
};

export default influenceAdd;