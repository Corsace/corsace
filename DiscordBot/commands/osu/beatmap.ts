import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../index";
import { osuClient } from "../../../Server/osu";
import { Beatmap, Mode } from "nodesu";
import { applyMods, acronymtoMods } from "../../../Interfaces/mods";
import beatmapEmbed from "../../functions/beatmapEmbed";
import respond from "../../functions/respond";

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

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const beatmapRegex = /(osu|old)\.ppy\.sh\/(s|b|beatmaps|beatmapsets)\/(\d+)(#(osu|taiko|fruits|mania)\/(\d+))?/i;
    const modRegex = /-m\s*(\S+)/i;
    const missRegex = /-x\s*(\S+)/i;

    let reg: RegExpExecArray | null = null; 
    if (m instanceof Message && beatmapRegex.test(m.content)) { // Beatmap link
        reg = beatmapRegex.exec(m.content);
    } else if (m instanceof ChatInputCommandInteraction && m.options.getString("beatmap")) {
        reg = beatmapRegex.exec(m.options.getString("beatmap")!); 
    } else { // Beatmap command, look at previous messages
        if (!m.channel) {
            await respond(m, "There isn't a channel(?)");
            return;
        }
        const prevMessages = await m.channel.messages.fetch({ limit: 100 });
        if (prevMessages.size === 0) { // Check if they are trolling and there's no previous messages
            await respond(m, "There are no previous messages... what are u doing");
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

    // Check if beatmap was found
    if (!reg) {
        if (m instanceof Message && beatmapRegex.test(m.content))
            return;
        
        await respond(m, "No previous beatmap link found");
        return;
    }

    // Check if mods were specified
    let mods = "NM";
    if (m instanceof Message && modRegex.test(m.content)) {
        const res = modRegex.exec(m.content);
        if (res) {
            mods = res[1].toUpperCase();
            if (mods.includes("NC") && !mods.includes("DT"))
                mods += "DT";
        }
    } else if (m instanceof ChatInputCommandInteraction && m.options.getString("mods")) {
        mods = m.options.getString("mods")!.toUpperCase();
        if (mods.includes("NC") && !mods.includes("DT"))
            mods += "DT";
    }

    let [beatmap, set] = await obtainBeatmap(reg, mods);
    if (!beatmap) {
        if (m instanceof Message && beatmapRegex.test(m.content))
            return;
        
        await respond(m, "No previous beatmap found from previous link on osu!");
        return;
    }
    if (!set)
        set = (await osuClient.beatmaps.getBySetId(beatmap.beatmapSetId)) as Beatmap[];

    const totalHits = beatmap.countNormal + beatmap.countSlider + beatmap.countSpinner;

    // Check if misses were specified
    let misses = 0;
    if (m instanceof Message && missRegex.test(m.content)) {
        const res = missRegex.exec(m.content);
        if (res) {
            misses = parseInt(res[1]);
            if (Number.isNaN(misses) || misses < 0 || misses > totalHits)
                misses = 0;
        }
    } else if (m instanceof ChatInputCommandInteraction && m.options.getInteger("misses")) {
        misses = m.options.getInteger("misses")!;
        if (misses < 0 || misses > totalHits)
            misses = 0;
    }

    // Apply mod scalings
    beatmap = applyMods(beatmap, mods);

    // Remove DT from NCDT
    if (mods.includes("NC") && mods.includes("DT"))
        mods = mods.replace("DT", "");

    const message = await beatmapEmbed(beatmap, mods, set, misses);
    await respond(m, undefined, [message]);
}

const data = new SlashCommandBuilder()
    .setName("beatmap")
    .setDescription("Obtain an osu! beatmap's info")
    .addStringOption(option => 
        option.setName("beatmap")
            .setDescription("The beatmap link or ID"))
    .addStringOption(option => 
        option.setName("mods")
            .setDescription("The mods to apply to the beatmap"))
    .addIntegerOption(option => 
        option.setName("misses")
            .setDescription("The amount of misses to apply to the beatmap's pp calculation"));

const beatmap: Command = {
    data, 
    alternativeNames: ["map"],
    category: "osu",
    run,
};

export default beatmap;
