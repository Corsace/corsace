import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { User } from "../../../Models/user";
import { Command } from "../index";
import { User as APIUser } from "nodesu";
import { osuClient } from "../../../Server/osu";
import { Influence } from "../../../Models/MCA_AYIM/influence";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { loginResponse } from "../../functions/loginResponse";
import commandUser from "../../functions/commandUser";
import getUser from "../../functions/dbFunctions/getUser";
import respond from "../../functions/respond";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply({ephemeral: true});

    const influenceRemoveRegex = /(inf|influence)del(ete)?\s+(.+)/i;
    const profileRegex = /(osu|old)\.ppy\.sh\/(u|users)\/(\S+)/i;
    const modeRegex = /-(standard|std|taiko|tko|catch|ctb|mania|man|storyboard|sb)/i;

    if (m instanceof Message && !influenceRemoveRegex.test(m.content)) {
        await m.reply("Please provide a year and user it's not that hard!!!!!");
        return;
    }

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    // Get year and/or search query params
    let year = 0;
    let search = "";
    let mode: ModeDivision | null = null;
    if (m instanceof Message) {
        const res = influenceRemoveRegex.exec(m.content);
        if (!res)
            return;
        const params = res[3].split(" ");
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
                mode = await ModeDivision.modeSelect(modeRegex.exec(param)![1]);
                if (mode) {
                    search = params.filter(p => p !== param).join(" ");
                    break;
                }
            }
        }
    } else {
        search = m.options.getString("user") ?? "";
        year = m.options.getInteger("year") ?? 0;
        if (year < 2007)
            year = (new Date).getUTCFullYear();
        const modeText = m.options.getString("mode");
        if (modeText)
            mode = await ModeDivision.modeSelect(modeText);
    }

    if (!mode)
        mode = await ModeDivision.findOne({ where: { ID: 1 }});

    const mca = await MCA.findOne({
        where: {
            results: MoreThanOrEqual(new Date()),
            nomination: {
                start: LessThanOrEqual(new Date()),
            },
        },
    });
    if (year < (mca ? mca.year : (new Date()).getUTCFullYear())) {
        await respond(m, "You cannot remove mapping influences for previous years!");
        return;
    }

    // Find user
    let q = search;
    let apiUser: APIUser;
    if (profileRegex.test(search)) { // Profile linked
        const res = profileRegex.exec(search);
        if (!res)
            return;
        q = res[3];
        apiUser = (await osuClient.user.get(res[3])) as APIUser;
    } else
        apiUser = (await osuClient.user.get(search)) as APIUser;

    if (!apiUser) {
        await respond(m, `No user found for **${q}**`);
        return;
    }

    const influenceUser = await User.findOne({
        where: {
            osu: { 
                userID: apiUser.userId.toString(), 
            },
        },
    });

    if (!influenceUser) {
        await respond(m, `**${apiUser.username}** doesn't even exist in the Corsace database! You're capping!!!!!!!`);
        return;
    }
    const influence = await Influence.findOne({
        where: {
            user: {
                ID: user.ID,
            },
            influence: {
                ID: influenceUser.ID,
            },
            year,
            mode: {
                ID: mode!.ID,
            },
        },
    });
    if (!influence) {
        await respond(m, `**${influenceUser.osu.username}** influencing you as a mapper for **${year}** in **${mode!.name}** doesn't seem to exist currently!`);
        return;
    }

    await influence.remove();

    await respond(m, `**${influenceUser.osu.username}** influencing you as a mapper for **${year}** in **${mode!.name}** has been removed!`);
    return;
    
}

const data = new SlashCommandBuilder()
    .setName("remove_influence")
    .setDescription("Allows you to delete a mapper influence.")
    .addStringOption(option => 
        option.setName("user")
            .setDescription("The osu! username/ID/profile link to remove influence from.")
            .setRequired(true))
    .addIntegerOption(option => 
        option.setName("year")
            .setDescription("The year of the influence.")
            .setMinValue(2007)
            .setRequired(true))
    .addStringOption(option => 
        option.setName("mode")
            .setDescription("The mode of the influence (default: Standard)")
            .addChoices(
                { name: "Standard", value: "standard" },
                { name: "Taiko", value: "taiko" },
                { name: "Catch", value: "catch" },
                { name: "Mania", value: "mania" },
                { name: "Storyboard", value: "storyboard" }
            ).setRequired(false));

const influenceRemove: Command = {
    data, 
    alternativeNames: ["remove_influences", "influence_remove", "influences_remove", "remove-influence", "remove-influences", "influence-remove", "influences-remove", "removeinfluence", "removeinfluences", "influenceremove", "influencesremove", "reminf", "infrem", "rinf", "infr"],
    category: "osu",
    run,
};

export default influenceRemove;