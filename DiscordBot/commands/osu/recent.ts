import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { osuClient } from "../../../Server/osu";
import { Command } from "../index";
import { Beatmap, Mode, User as APIUser, UserScore } from "nodesu";
import { OAuth, User } from "../../../Models/user";
import { applyMods, acronymtoMods, modsToAcronym } from "../../../Interfaces/mods";
import beatmapEmbed from "../../functions/beatmapEmbed";
import { loginResponse } from "../../functions/loginResponse";
import getUser from "../../functions/dbFunctions/getUser";
import commandUser from "../../functions/commandUser";
import respond from "../../functions/respond";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const recentRegex = /(^r|recent|rs|rb|recentb|recentbest)\s+(.+)/i;
    const modRegex = /-m\s*(\S+)/i;
    const strictRegex = /-nostrict/i;

    let user: User;
    let apiUser: APIUser;
    let mods = "";
    let strict = true;
    let index = 1;

    // Check if mods were specified
    if (
        (m instanceof Message && modRegex.test(m.content)) ||
        (m instanceof ChatInputCommandInteraction && m.options.getString("mods"))
    ) {
        const res = modRegex.exec(m instanceof Message ? m.content : m.options.getString("mods")!);
        if (res) {
            mods = res[1].toUpperCase();
            if (mods.includes("NC") && !mods.includes("DT"))
                mods += "DT";
        }
        if (m instanceof Message)
            m.content = m.content.replace(modRegex, "");

        // Check if strict or not
        if (
            (m instanceof Message && strictRegex.test(m.content)) ||
            (m instanceof ChatInputCommandInteraction && !m.options.getBoolean("strict"))
        ) {
            strict = false;
            if (m instanceof Message)
                m.content = m.content.replace(strictRegex, "");
        }
    }

    // Check for index
    if (m instanceof Message) {
        for (const txt of m.content.split(" ")) {
            const num = parseInt(txt);
            if (isNaN(num))
                continue;
            m.content = m.content.replace(txt, "");
            index = num;
            break;
        }
    } else {
        index = m.options.getInteger("index") ?? 1;
    }

    // Get user
    const isOtherUser = (m instanceof Message && recentRegex.test(m.content)) || (m instanceof ChatInputCommandInteraction && m.options.getString("user"));
    if (isOtherUser) {
        if (m instanceof Message) {
            const res = recentRegex.exec(m.content);
            if (!res)
                return;

            apiUser = (await osuClient.user.get(res[2])) as APIUser;
        } else
            apiUser = (await osuClient.user.get(m.options.getString("user")!)) as APIUser;

        let userQ = await User.findOne({
            where: {
                osu: { 
                    userID: apiUser.userId.toString(), 
                },
            },
        });

        if (!userQ) {
            userQ = new User;
            userQ.country = apiUser.country.toString();
            userQ.osu = new OAuth;
            userQ.osu.userID = `${apiUser.userId}`;
            userQ.osu.username = apiUser.username;
            userQ.osu.avatar = "https://a.ppy.sh/" + apiUser.userId;
            await userQ.save();
        }
        user = userQ;
    } else {
        const userQ = await getUser(commandUser(m).id, "discord", false);
        if (!userQ) {
            await loginResponse(m);
            return;
        }

        apiUser = (await osuClient.user.get(userQ.osu.userID)) as APIUser;
        user = userQ;
    }

    // Get score list
    let scores: UserScore[];
    if (
        (m instanceof Message && /^(rb|recentb|recentbest)/i.test(m.content.substring(1))) ||
        (m instanceof ChatInputCommandInteraction && m.options.getBoolean("best"))
    ) {
        scores = (await osuClient.user.getBest(apiUser.userId, Mode.all, 100)) as UserScore[];
        if (scores.length < 1) {
            await respond(m, `${!isOtherUser ? "you" : `**${user.osu.username}**`} has no top plays.... What are u doing`);
            return;
        }
    } else {
        scores = (await osuClient.user.getRecent(apiUser.userId, Mode.all, 50)) as UserScore[];
        if (scores.length < 1) {
            await respond(m, `${!isOtherUser ? "You have" : `**${user.osu.username}** has`} not played recently`);
            return;
        }
    }
    scores = scores.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Filter out mods if applicable
    if (mods !== "") {
        const modVal = acronymtoMods(mods);
        if (!modVal) {
            await respond(m, `Error parsing the mods ${mods}`);
            return;
        }
        scores = scores.filter(score => (!score.enabledMods && modVal === 0) || (strict && score.enabledMods && modVal === score.enabledMods) || (!strict && score.enabledMods && (modVal & score.enabledMods) === modVal));
        await respond(m, `No scores with the mod combination **${mods}** exist!`);
        return;
    }

    // Check if index given is larger than score list size
    let warning = "";
    if (index > scores.length) {
        index = scores.length;
        warning = `Defaulted to max: ${scores.length}`;
    }

    // Get score and beatmap
    const score = scores[index - 1];
    mods = modsToAcronym(score.enabledMods ?? 0);
    let beatmap = ((await osuClient.beatmaps.getByBeatmapId(score.beatmapId, Mode.all, 1, undefined, score.enabledMods)) as Beatmap[])[0];
    beatmap = applyMods(beatmap, mods);

    const message = await beatmapEmbed(beatmap, mods, user, undefined, score);

    if (!(
        (m instanceof Message && /^(rb|recentb|recentbest)/i.test(m.content.substring(1))) ||
        (m instanceof ChatInputCommandInteraction && m.options.getBoolean("best"))
    )) {
        // Add number of tries in footer
        let attempt = 0;
        for (let i = index - 1; i < scores.length; i++) {
            if (score.beatmapId === scores[i].beatmapId)
                attempt++;
            else
                break;
        }
        message.setFooter({ text: `Try #${attempt} | <t:${score.date.getTime() / 1000}:R>` });
    } else
        message.setFooter({ text: `<t:${score.date.getTime() / 1000}:R>` });

    await respond(m, warning, [message]);
}

const data = new SlashCommandBuilder()
    .setName("recent")
    .setDescription("Obtain your or someone else's recent score on osu!")
    .addStringOption(option => 
        option.setName("user")
            .setDescription("The user to query (Default you)"))
    .addStringOption(option => 
        option.setName("mods")
            .setDescription("The mods to filter by (Default all)"))
    .addIntegerOption(option => 
        option.setName("index")
            .setDescription("The nth score to get (Default latest)")
            .setMinValue(1)
            .setMaxValue(100))
    .addBooleanOption(option => 
        option.setName("strict")
            .setDescription("Whether to filter by strict mods or not (Default true)"))
    .addBooleanOption(option => 
        option.setName("best")
            .setDescription("Whether to limit to top scores or not (Default false)"));

const recent: Command = {
    data, 
    alternativeNames: ["rs", "recentbest", "recentb", "rb", "r"],
    category: "osu",
    run,
};

export default recent;