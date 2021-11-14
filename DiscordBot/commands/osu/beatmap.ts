import { Message } from "discord.js";
import { Command } from "../index";
import { osuClient } from "../../../Server/osu";
import { Beatmap, Mode } from "nodesu";
import { applyMods, acronymtoMods } from "../../../Interfaces/mods";
import beatmapEmbed from "../../functions/beatmapEmbed";

async function obtainBeatmap (res: RegExpExecArray, mods: string): Promise<[Beatmap | undefined, Beatmap[] | undefined]> {
    let beatmap: Beatmap | undefined = undefined;
    let set: Beatmap[] | undefined = undefined;
    switch (res[2]) {
        case "s": {
            set = (await osuClient.beatmaps.getBySetId(res[3], Mode.all, undefined, undefined, acronymtoMods(mods)) as Beatmap[]);
            beatmap = set.sort((a, b) => b.difficultyRating - a.difficultyRating)[0];
            break;
        } case "b": {
            beatmap = (await osuClient.beatmaps.getByBeatmapId(res[3], Mode.all, undefined, undefined, acronymtoMods(mods)) as Beatmap[])[0];
            break;
        } case "beatmaps": {
            beatmap = (await osuClient.beatmaps.getByBeatmapId(res[3], Mode.all, undefined, undefined, acronymtoMods(mods)) as Beatmap[])[0];
            break;
        } case "beatmapsets": {
            set = (await osuClient.beatmaps.getBySetId(res[3], Mode.all, undefined, undefined, acronymtoMods(mods)) as Beatmap[]);
            if (res[6])
                beatmap = set.find(map => map.beatmapId.toString() === res[6]);
            else
                beatmap = set.sort((a, b) => b.difficultyRating - a.difficultyRating)[0];
            break;
        } 
    }
    return [beatmap, set];
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

        for (const message of prevMessages.toJSON()) {
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
        msg.delete();
        if (beatmapRegex.test(m.content))
            return;
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

    let [beatmap, set] = await obtainBeatmap(reg, mods);
    if (!beatmap) {
        msg.delete();
        if (beatmapRegex.test(m.content))
            return;
        m.channel.send("No previous beatmap found from previous link on osu!");
        return;
    }
    if (!set)
        set = (await osuClient.beatmaps.getBySetId(beatmap.beatmapSetId)) as Beatmap[];

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
    beatmap = applyMods(beatmap, mods);

    // Remove DT from NCDT
    if (mods.includes("NC") && mods.includes("DT"))
        mods = mods.replace("DT", "");

    const message = await beatmapEmbed(beatmap, mods, set, misses);
    msg.delete();
    m.channel.send({ embeds: [message] });
}

const beatmap: Command = {
    name: ["map", "beatmap"], 
    description: "Obtain an osu! beatmap's info",
    usage: "!(map|beatmap)", 
    category: "osu",
    command,
};

export default beatmap;
