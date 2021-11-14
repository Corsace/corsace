import { Message } from "discord.js";
import { osuClient } from "../../../Server/osu";
import { Command } from "../index";
import { Beatmap, Mode, User as APIUser, UserScore } from "nodesu";
import { OAuth, User } from "../../../Models/user";
import { applyMods, acronymtoMods, modsToAcronym } from "../../../Interfaces/mods";
import beatmapEmbed from "../../functions/beatmapEmbed";
import timeSince from "../../../Server/utils/timeSince";

async function command (m: Message) {
    const recentRegex = /(^r|recent|rs|rb|recentb|recentbest)\s+(.+)/i;
    const modRegex = /-m\s*(\S+)/i;
    const strictRegex = /-nostrict/i;

    let user: User;
    let apiUser: APIUser;
    let mods = "";
    let strict = true;
    let index = 1;

    // Check if mods were specified
    if (modRegex.test(m.content)) {
        const res = modRegex.exec(m.content);
        if (res) {
            mods = res[1].toUpperCase();
            if (mods.includes("NC") && !mods.includes("DT"))
                mods += "DT";
        }
        m.content = m.content.replace(modRegex, "");

        // Check if strict or not
        if (strictRegex.test(m.content)) {
            strict = false;
            m.content = m.content.replace(strictRegex, "");
        }
    }

    // Check for index
    for (const txt of m.content.split(" ")) {
        const num = parseInt(txt);
        if (isNaN(num))
            continue;
        m.content = m.content.replace(txt, "");
        index = num;
        break;
    }

    // Run command now
    if (recentRegex.test(m.content)) {
        const res = recentRegex.exec(m.content);
        if (!res)
            return;

        apiUser = (await osuClient.user.get(res[2])) as APIUser;

        let userQ = await User.findOne({
            osu: { 
                userID: apiUser.userId.toString(), 
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
        const userQ = await User.findOne({
            discord: {
                userID: m.author.id,
            },
        });
        if (!userQ) {
            await m.channel.send("No user found in the corsace database for you! Please login to https://corsace.io with your discord and osu! accounts!");
            return;
        }

        apiUser = (await osuClient.user.get(userQ.osu.userID)) as APIUser;
        user = userQ;
    }

    // Get score list
    let scores: UserScore[];
    if (/^(rb|recentb|recentbest)/i.test(m.content.substring(1))) {
        scores = (await osuClient.user.getBest(apiUser.userId, Mode.all, 100)) as UserScore[];
        if (scores.length < 1) {
            m.channel.send(`${!recentRegex.test(m.content) ? "you" : `**${user.osu.username}**`} has no top plays.... What are u doing`);
            return;
        }
    } else {
        scores = (await osuClient.user.getRecent(apiUser.userId, Mode.all, 50)) as UserScore[];
        if (scores.length < 1) {
            m.channel.send(`${!recentRegex.test(m.content) ? "You have" : `**${user.osu.username}** has`} not played recently`);
            return;
        }
    }
    scores = scores.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Filter out mods if applicable
    if (mods !== "") {
        const modVal = acronymtoMods(mods);
        if (!modVal) {
            m.channel.send(`Error parsing the mods ${mods}`);
            return;
        }
        scores = scores.filter(score => (!score.enabledMods && modVal === 0) || (strict && score.enabledMods && modVal === score.enabledMods) || (!strict && score.enabledMods && (modVal & score.enabledMods) === modVal));
        await m.channel.send(`No scores with the mod combination **${mods}** exist!`);
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

    const message = await beatmapEmbed(beatmap, mods, undefined, undefined, score, user);

    message.footer = { text: "" };

    if (!/^(rb|recentb|recentbest)/i.test(m.content.substring(1))) {
        // Add number of tries in footer
        let attempt = 0;
        for (let i = index - 1; i < scores.length; i++) {
            if (score.beatmapId === scores[i].beatmapId)
                attempt++;
            else
                break;
        }
        message.footer =  { text: `Try #${attempt} | ` };
    }
    message.footer.text += timeSince(score.date, new Date());
    m.channel.send({ 
        content: warning, 
        embeds: [message],
    });
}

const recent: Command = {
    name: ["r", "rs", "rb", "recent", "recents", "recentb", "recentbest"], 
    description: "Obtain your or someone else's most recent (top) score",
    usage: "!(r|recent|rs|rb|recentb|recentbest)", 
    category: "osu",
    command,
};

export default recent;