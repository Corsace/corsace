import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, DiscordAPIError, Message, SlashCommandBuilder } from "discord.js";
import { OAuth, User } from "../../../Models/user";
import { Command } from "../index";
import { User as APIUser } from "nodesu";
import { osuClient } from "../../../Server/osu";
import { Influence } from "../../../Models/MCA_AYIM/influence";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { isEligibleFor } from "../../../Server/middleware/mca-ayim";
import { loginResponse } from "../../functions/loginResponse";
import { randomUUID } from "crypto";
import commandUser from "../../functions/commandUser";
import getUser from "../../functions/dbFunctions/getUser";
import respond from "../../functions/respond";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply({ephemeral: true});

    const influenceAddRegex = /(inf|influence)add\s+(.+)/i;
    const profileRegex = /(osu|old)\.ppy\.sh\/(u|users)\/(\S+)/i;
    const modeRegex = /-(standard|std|taiko|tko|catch|ctb|mania|man|storyboard|sb)/i;
    const commentRegex = /-c (.+)/i;

    if (m instanceof Message && !influenceAddRegex.test(m.content)) {
        await m.reply("Please at least provide a user come on!!!!!!");
        return;
    }

    const authorID = commandUser(m).id;

    const user = await getUser(authorID, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    // Get year, search, mode, and/or comment params
    let comment = "";
    let year = (new Date).getUTCFullYear();
    let search = "";
    let mode: ModeDivision | null = null;
    if (m instanceof Message) {
        if (commentRegex.test(m.content)) {
            comment = commentRegex.exec(m.content)![1];
            m.content = m.content.replace(commentRegex, "").trim();
        }
        const res = influenceAddRegex.exec(m.content);
        if (!res)
            return;
        const params = res[2].split(" ");
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
        comment = m.options.getString("comment") ?? "";
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

    if (!isEligibleFor(user, mode!.ID, year)) {
        await respond(m, `You did not rank a set or guest difficulty this year in **${mode!.name}**!${year === (new Date).getUTCFullYear() ? "\nFor adding influences in the current year, then if you have ranked a set, re-login to Corsace with your osu! account, and you should be able to add them after!" : ""}`);
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

    let influenceUser = await User.findOne({
        where: {
            osu: { 
                userID: apiUser.userId.toString(), 
            },
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
            user: {
                ID: user.ID,
            },
            year,
            mode: {
                ID: mode!.ID,
            },
        },
        relations: ["user", "influence"],
    });
    if (influences.length === 5) {
        await respond(m, `You already have 5 influences for **${year}** in **${mode!.name}**!`);
        return;
    } 
    if (influences.some(inf => inf.influence.osu.userID === influenceUser!.osu.userID)) {
        await respond(m, `You have already marked **${influenceUser.osu.username}** as a mapping influence for **${year}** in **${mode!.name}**!`);
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
        where: {
            results: MoreThanOrEqual(new Date()),
            nomination: {
                start: LessThanOrEqual(new Date()),
            },
        },
    });
    const buttonIDs = {
        true: randomUUID(),
        false: randomUUID(),
    }
    if (year < (mca ? mca.year : (new Date()).getUTCFullYear())) {
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(buttonIDs.true)
                    .setLabel("Yes")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(buttonIDs.false)
                    .setLabel("No")
                    .setStyle(ButtonStyle.Danger)
            );
        const message = await m.channel!.send({
            content: `Are you sure you want to add **${influenceUser.osu.username}** as a mapping influence for **${year}** in **${mode!.name}**? You cannot remove influences for years past the currently running MCA!`,
            components: [row],
        });
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 10000 });
        collector.on("collect", async (i) => {
            if (i.user.id !== authorID) {
                i.reply({ content: "Fack off cunt", ephemeral: true });
                return;
            }

            if (i.customId === buttonIDs.true) {
                await influence.save();
                await respond(m, `Added **${influenceUser!.osu.username}** as a mapping influence for **${year}** in **${mode!.name}**!`);
            }
            await message.delete();
        });
        collector.on("end", async () => {
            await message.delete();
        });
        return;
    }

    await influence.save();

    await respond(m, `Added **${influenceUser.osu.username}** as a mapping influence for **${year}** in **${mode!.name}**!`);
    return;
    
}

const data = new SlashCommandBuilder()
    .setName("add_influence")
    .setDescription("Allows you to add a mapper influence for a given year")
    .addStringOption(option => 
        option.setName("user")
            .setDescription("The osu! username/ID/profile link to search for influences for")
            .setRequired(true))
    .addIntegerOption(option => 
        option.setName("year")
            .setDescription("The year to search for influences in")
            .setMinValue(2007))
    .addStringOption(option => 
        option.setName("comment")
            .setDescription("The comment to add to the influence"))
    .addStringOption(option => 
        option.setName("mode")
            .setDescription("The mode to search for influences in (default: Standard)")
            .addChoices(
                { name: "Standard", value: "standard" },
                { name: "Taiko", value: "taiko" },
                { name: "Catch", value: "catch" },
                { name: "Mania", value: "mania" },
                { name: "Storyboard", value: "storyboard" }
            )
            .setRequired(false));

const influenceAdd: Command = {
    data, 
    alternativeNames: ["add_influences", "influence_add", "influences_add", "add-influence", "add-influences", "influence-add", "influences-add", "addinfluence", "addinfluences", "influenceadd", "influencesadd", "addinf", "infadd", "ainf", "infa"],
    category: "osu",
    run,
};

export default influenceAdd;