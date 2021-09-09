import { Message, MessageEmbed, MessageEmbedOptions } from "discord.js";
import { Command } from "../index";
import { osuClient } from "../../../Server/osu";
import { Beatmap, Mode, ApprovalStatus, Score } from "nodesu";
import { applyMods, acronymtoMods } from "../../../Interfaces/mods";
import modeColour from "../../functions/modeColour";
import ppCalculator from "../../functions/ppCalculator";

async function obtainBeatmap (res: RegExpExecArray, mods: string): Promise<Beatmap | undefined> {
    let beatmap: Beatmap | undefined = undefined;
    switch (res[2]) {
        case "s": {
            const set = (await osuClient.beatmaps.getBySetId(res[3], Mode.all, undefined, undefined, acronymtoMods(mods)) as Beatmap[]);
            beatmap = set.sort((a, b) => b.difficultyRating - a.difficultyRating)[0];
            break;
        } case "b": {
            beatmap = (await osuClient.beatmaps.getByBeatmapId(res[3], Mode.all, undefined, undefined, acronymtoMods(mods)) as Beatmap[])[0];
            break;
        } case "beatmaps": {
            beatmap = (await osuClient.beatmaps.getByBeatmapId(res[3], Mode.all, undefined, undefined, acronymtoMods(mods)) as Beatmap[])[0];
            break;
        } case "beatmapsets": {
            if (res[6].length > 0) {
                beatmap = (await osuClient.beatmaps.getByBeatmapId(res[6], Mode.all, undefined, undefined, acronymtoMods(mods)) as Beatmap[])[0];
            } else {
                const set = (await osuClient.beatmaps.getBySetId(res[3], Mode.all, undefined, undefined, acronymtoMods(mods)) as Beatmap[]);
                beatmap = set.sort((a, b) => b.difficultyRating - a.difficultyRating)[0];
            }
            break;
        } 
    }
    return beatmap;
}

async function command (m: Message) {
    const beatmapRegex = /(osu|old)\.ppy\.sh\/(s|b|beatmaps|beatmapsets)\/(\d+)(#(osu|taiko|fruits|mania)\/(\d+))?/i;
    const modRegex = /-m\s*(\S+)/i;
    const missRegex = /-x\s*(\S+)/i;

    let reg: RegExpExecArray | null = null; 
    if (beatmapRegex.test(m.content)) { // Beatmap link
        reg = beatmapRegex.exec(m.content);
    } else { // Beatmap command, look at previous messages
        const prevMessages = await m.channel.messages.fetch({ limit: 100 });
        if (prevMessages.size === 0) { // Check if they are trolling and there's no previous messages
            m.channel.send("There are no previous messages... what are u doing");
            return;
        }

        for (const message of prevMessages.array()) {
            // Look at the message's embed in case
            if (message.embeds.length > 0) {
                if (message.embeds[0].url && beatmapRegex.test(message.embeds[0].url)) {
                    reg = beatmapRegex.exec(message.embeds[0].url);
                    break;
                } else if (message.embeds[0].author?.url && beatmapRegex.test(message.embeds[0].author.url)) {
                    reg = beatmapRegex.exec(message.embeds[0].author.url);
                    break;
                }
            } else if (beatmapRegex.test(message.content)) {
                reg = beatmapRegex.exec(message.content);
                break;
            }
        }
    }

    const msg = await m.channel.send("Processing beatmap...");

    // Check if beatmap was found
    if (!reg) {
        if (beatmapRegex.test(m.content))
            return;
        msg.delete();
        m.channel.send("No previous beatmap link found");
        return;
    }

    // Check if mods were specified
    let mods = "NM";
    if (modRegex.test(m.content)) {
        const res = modRegex.exec(m.content);
        if (res) {
            mods = res[1].toUpperCase();
            if (mods.includes("NC") && !mods.includes("DT"))
                mods += "DT";
        }
    }

    let beatmap = await obtainBeatmap(reg, mods);
    if (!beatmap) {
        if (beatmapRegex.test(m.content))
            return;
        msg.delete();
        m.channel.send("No previous beatmap found from previous link on osu!");
        return;
    }
    const set = (await osuClient.beatmaps.getBySetId(beatmap.beatmapSetId)) as Beatmap[];

    const totalHits = beatmap.countNormal + beatmap.countSlider + beatmap.countSpinner;

    // Check if misses were specified
    let misses = 0;
    if (missRegex.test(m.content)) {
        const res = missRegex.exec(m.content);
        if (res) {
            misses = parseInt(res[1]);
            if (Number.isNaN(misses) || misses < 0 || misses > totalHits)
                misses = 0;
        }
    }

    // Apply mod scalings
    const difficultyScaler = mods.includes("HR") ? "HR" : mods.includes("EZ") ? "EZ" : undefined; 
    const speedScaler = mods.includes("DT") ? "DT" : mods.includes("HT") ? "HT" : undefined;
    beatmap = applyMods(beatmap, difficultyScaler, speedScaler);

    // Remove DT from NCDT
    if (mods.includes("NC") && mods.includes("DT"))
        mods = mods.replace("DT", "");

    // Obtain beatmap information
    const totalMinutes = Math.floor(beatmap.totalLength / 60);
    let totalSeconds = `${Math.round(beatmap.totalLength % 60)}`;
    if (totalSeconds.length === 1)
        totalSeconds = `0${totalSeconds}`;
    const hitMinutes = Math.floor(beatmap.hitLength / 60);
    let hitSeconds = `${Math.round(beatmap.hitLength % 60)}`;
    if (hitSeconds.length === 1)
        hitSeconds = `0${hitSeconds}`;

    // Not sure if there's a better way to get this
    let rankStatus = "Graveyard";
    for (const status of Object.keys(ApprovalStatus)) {
        if (beatmap.approved === ApprovalStatus[status]) {
            rankStatus = `${status[0].toUpperCase()}${status.substring(1)}`; 
        }
    }

    let sr = `**SR:** ${beatmap.difficultyRating.toFixed(2)}`;
    if (beatmap.mode === Mode.osu)
        sr += ` **Aim:** ${beatmap.diffAim.toFixed(2)} **Speed:** ${beatmap.diffSpeed.toFixed(2)}`;
    const length = `**Length:** ${totalMinutes}:${totalSeconds} (${hitMinutes}:${hitSeconds}) `;
    const bpm = `**BPM:** ${beatmap.bpm} `;
    const combo = `**FC:** ${beatmap.maxCombo}x`;
    const mapStats = `**CS:** ${beatmap.CS.toFixed(2)} **AR:** ${beatmap.AR.toFixed(2)} **OD:** ${beatmap.OD.toFixed(2)} **HP:** ${beatmap.HP.toFixed(2)}`;
    const mapObjs = `**Circles:** ${beatmap.countNormal} **Sliders:** ${beatmap.countSlider} **Spinners:** ${beatmap.countSpinner}`;
    const status = `**Rank Status:** ${rankStatus}`;
    const download = `**Download:** [osz link](https://osu.ppy.sh/beatmapsets/${beatmap.beatmapSetId}/download) | <osu://dl/${beatmap.beatmapSetId}>`;
    let diffs = `**${set.length}** difficulties`;
    if (set.length === 1)
        diffs = "**1** difficulty";

    // Creating scores for pp calc
    const score100 = new Score({
        maxcombo: beatmap.maxCombo,
        count300: totalHits,
        count100: 0,
        count50: 0,
        countmiss: 0,
        enabled_mods: acronymtoMods(mods),
    });
    const score99 = new Score({
        maxcombo: beatmap.maxCombo,
        count300: (0.99 * totalHits * 6 - totalHits + misses) / 5,
        count100: (0.99 * totalHits * 6 - totalHits + misses) % 5,
        count50: totalHits - (0.99 * totalHits * 6 - totalHits + misses) / 5 - (0.99 * totalHits * 6 - totalHits + misses) % 5 - misses,
        countmiss: misses,
        enabled_mods: acronymtoMods(mods),
    });
    const score98 = new Score({
        maxcombo: beatmap.maxCombo,
        count300: (0.98 * totalHits * 6 - totalHits + misses) / 5,
        count100: (0.98 * totalHits * 6 - totalHits + misses) % 5,
        count50: totalHits - (0.98 * totalHits * 6 - totalHits + misses) / 5 - (0.98 * totalHits * 6 - totalHits + misses) % 5 - misses,
        countmiss: misses,
        enabled_mods: acronymtoMods(mods),
    });
    const score97 = new Score({
        maxcombo: beatmap.maxCombo,
        count300: (0.97 * totalHits * 6 - totalHits + misses) / 5,
        count100: (0.97 * totalHits * 6 - totalHits + misses) % 5,
        count50: totalHits - (0.97 * totalHits * 6 - totalHits + misses) / 5 - (0.97 * totalHits * 6 - totalHits + misses) % 5 - misses,
        countmiss: misses,
        enabled_mods: acronymtoMods(mods),
    });
    const score95 = new Score({
        maxcombo: beatmap.maxCombo,
        count300: (0.95 * totalHits * 6 - totalHits + misses) / 5,
        count100: (0.95 * totalHits * 6 - totalHits + misses) % 5,
        count50: totalHits - (0.95 * totalHits * 6 - totalHits + misses) / 5 - (0.95 * totalHits * 6 - totalHits + misses) % 5 - misses,
        countmiss: misses,
        enabled_mods: acronymtoMods(mods),
    });
    const ppTextHeader = `**[${beatmap.version}]** with mods: **${mods}**`;
    const ppText = `**100%:** ${Math.floor(ppCalculator(beatmap, score100))}pp | **99%:** ${Math.floor(ppCalculator(beatmap, score99))}pp | **98%:** ${Math.floor(ppCalculator(beatmap, score98))}pp | **97%:** ${Math.floor(ppCalculator(beatmap, score97))}pp | **95%:** ${Math.floor(ppCalculator(beatmap, score95))}pp`;

    const embedMsg: MessageEmbedOptions = {
        author: {
            url: `https://osu.ppy.sh/beatmaps/${beatmap.beatmapId}`,
            name: `${beatmap.artist} - ${beatmap.title} by ${beatmap.creator}`,
            iconURL: `https://a.ppy.sh/${beatmap.creatorId}`,
        },
        description: sr + "\n" +
			length + bpm + combo + "\n" +
			mapStats + "\n" +
			mapObjs + "\n" +
			status + "\n" +
			download + "\n" +
			diffs + "\n" + "\n" +
            ppTextHeader + "\n" +
            ppText,
        color: modeColour(beatmap.mode),
        footer: {
            text: `Corsace | https://corsace.io`,
        },
        thumbnail: {
            url: `https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`,
        },
    };
    msg.delete();

    const message = new MessageEmbed(embedMsg);
    m.channel.send(message);
}

const beatmap: Command = {
    name: /(map|beatmap)/i, 
    description: "Obtain an osu! beatmap's info",
    usage: "!(map|beatmap)", 
    command,
};

export default beatmap;