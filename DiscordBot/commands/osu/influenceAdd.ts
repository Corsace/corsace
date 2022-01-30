import { Message, MessageActionRow, MessageButton } from "discord.js";
import { OAuth, User } from "../../../Models/user";
import { Command } from "../index";
import { User as APIUser } from "nodesu";
import { osuClient } from "../../../Server/osu";
import { Influence } from "../../../Models/MCA_AYIM/influence";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";

async function command (m: Message) {
    const influenceAddRegex = /(inf|influence)add\s+(.+)/i;
    const profileRegex = /(osu|old)\.ppy\.sh\/(u|users)\/(\S+)/i;

    if (!influenceAddRegex.test(m.content)) {
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
    const res = influenceAddRegex.exec(m.content);
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
    } else {
        await m.channel.send(`Could not parse any year provided!`);
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
    } else {
        const infCheck = await Influence.findOne({
            user,
            influence: influenceUser,
            year: parseInt(year, 10),
        });
        if (infCheck) {
            await m.channel.send(`You have already marked **${influenceUser.osu.username}** as a mapping influence for **${year}**!`);
            return;
        }
    }

    // Warn for older years
    const mca = await MCA.findOne({
        results: MoreThanOrEqual(new Date()),
        nomination: {
            start: LessThanOrEqual(new Date()),
        },
    });
    if (parseInt(year, 10) < (mca ? mca.year : (new Date()).getUTCFullYear())) {
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
            content: `Are you sure you want to add **${influenceUser.osu.username}** as a mapping influence for **${year}**? You cannot remove influences for years past the currently running MCA!`,
            components: [row],
        });
        const collector = message.createMessageComponentCollector({ componentType: "BUTTON", time: 10000 });
        collector.on("collect", async (i) => {
            if (i.user.id !== m.author.id) {
                i.reply({ content: "Fack off cunt", ephemeral: true });
                return;
            }

            if (i.customId === "true") {
                const influence = new Influence;
                influence.user = user;
                influence.influence = influenceUser!;
                influence.year = parseInt(year, 10);
                await influence.save();

                m.reply(`Added **${influenceUser!.osu.username}** as a mapping influence for **${year}**!`);
            }
            await message.delete();
        });
        return;
    }

    const influence = new Influence;
    influence.user = user;
    influence.influence = influenceUser;
    influence.year = parseInt(year, 10);
    await influence.save();

    m.reply(`Added **${influenceUser.osu.username}** as a mapping influence for **${year}**!`);
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