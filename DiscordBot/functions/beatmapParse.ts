
import Axios from "axios";
import { Entry, Parse } from "unzipper";
import { ChatInputCommandInteraction, ForumChannel, Message } from "discord.js";
import { Beatmap as APIBeatmap} from "nodesu";
import { CustomBeatmap } from "../../Models/tournaments/mappools/customBeatmap";
import { deletePack } from "../../Server/functions/tournaments/mappool/mappackFunctions";
import { MappoolMapHistory } from "../../Models/tournaments/mappools/mappoolMapHistory";
import getCustomThread from "./tournamentFunctions/getCustomThread";
import beatmapEmbed from "./beatmapEmbed";
import { applyMods, modsToAcronym } from "../../Interfaces/mods";
import mappoolLog from "./tournamentFunctions/mappoolLog";
import respond from "./respond";
import { MappoolMap } from "../../Models/tournaments/mappools/mappoolMap";
import { Tournament } from "../../Models/tournaments/tournament";
import { Mappool } from "../../Models/tournaments/mappools/mappool";
import { MappoolSlot } from "../../Models/tournaments/mappools/mappoolSlot";
import { User } from "../../Models/user";
import { discordClient } from "../../Server/discord";
import { parseBeatmap, ParserBeatmap } from "wasm-replay-parser-rs";

export async function beatmapParse (m: Message | ChatInputCommandInteraction, diff: string, link: string) {
    let beatmap: ParserBeatmap | undefined = undefined;
    let background: string | undefined = undefined;
    let axiosData: any = null;
    try {
        const { data } = await Axios.get(link, { responseType: "stream" });
        axiosData = data;
    } catch (e) {
        m.reply("Can't download the map. Make sure the link is valid");
        return;
    }
    const zip = axiosData.pipe(Parse({ forceStream: true }));
    let foundBeatmap = false;
    for await (const _entry of zip) {
        const entry = _entry as Entry;
        const buffer = await entry.buffer();

        if (entry.type === "File" && entry.props.path.endsWith(".osu") && !foundBeatmap) {
            const parsedBeatmap = parseBeatmapExtra(buffer);

            console.log(parsedBeatmap);
            
            if (diff !== "" && parsedBeatmap.diff_name.toLowerCase() !== diff.toLowerCase())
                continue;

            beatmap = parsedBeatmap;
            foundBeatmap = true;
            if (background)
                break;
        } else if (entry.type === "File" && (
            entry.props.path.endsWith(".png") ||
            entry.props.path.endsWith(".jpg") ||
            entry.props.path.endsWith(".jpeg")
        )) {
            // Get image and send in a discord message, then assign the link to the background variable
            const message = await m.channel!.send({
                files: [{
                    attachment: buffer,
                    name: entry.props.path,
                }],
            });
            background = message.attachments.first()!.url;
            if (beatmap)
                break;
        }

        entry.autodrain();
    }

    return {
        beatmap,
        background,
    };
}

export async function parsedBeatmapToCustom (m: Message | ChatInputCommandInteraction, tournament: Tournament, mappool: Mappool, slot: MappoolSlot, mappoolMap: MappoolMap, beatmapData: { beatmap: ParserBeatmap | undefined, background: string | undefined }, link: string, user: User, mappoolSlot: string) {
    if (!mappoolMap.customBeatmap)
        mappoolMap.customBeatmap = new CustomBeatmap();

    const beatmap = beatmapData.beatmap!;

    const artist = beatmap.artist;
    const title = beatmap.title;
    const diff = beatmap.diff_name;

    const cs = beatmap.cs;
    const ar = beatmap.ar ?? -1;
    const od = beatmap.od;
    const hp = beatmap.hp;
    const circles = beatmap.circles;
    const sliders = beatmap.sliders;
    const spinners = beatmap.spinners;
    const maxCombo = beatmap.difficulty?.max_combo;

    // Obtaining length
    const lengthMs = beatmap.hit_objects?.;
    const length = lengthMs / 1000;

    // Obtaining bpm
    const changedLines = beatmap.timing_points.filter(line => line.change === true);
    const timingPoints = changedLines.map((line, i) => {
        return {
            bpm: 60000 / line.ms_per_beat,
            length: (i < changedLines.length - 1) ? changedLines[i + 1].time - line.time : beatmap!.objects[beatmap!.objects.length - 1].time - line.time,
        };
    });
    let bpm = 0;
    if (timingPoints.length === 1)
        bpm = timingPoints[0].bpm;
    else
        bpm = timingPoints.reduce((acc, curr) => acc + curr.length * curr.bpm, 0) / timingPoints.reduce((acc, curr) => acc + curr.length, 0);

    // Obtaining star rating
    const calc = new osu.std_diff().calc({map: beatmap, mods: slot.allowedMods || 0});
    const aimSR = calc.aim;
    const speedSR = calc.speed;
    const sr = calc.total;

    mappoolMap.customBeatmap.link = link;
    mappoolMap.customBeatmap.background = beatmapData.background;
    mappoolMap.customBeatmap.artist = artist;
    mappoolMap.customBeatmap.title = title;
    mappoolMap.customBeatmap.BPM = parseFloat(bpm.toFixed(2));
    mappoolMap.customBeatmap.totalLength = length;
    mappoolMap.customBeatmap.hitLength = length;
    mappoolMap.customBeatmap.difficulty = diff;
    mappoolMap.customBeatmap.circleSize = cs;
    mappoolMap.customBeatmap.overallDifficulty = od;
    mappoolMap.customBeatmap.approachRate = ar;
    mappoolMap.customBeatmap.hpDrain = hp;
    mappoolMap.customBeatmap.circles = circles;
    mappoolMap.customBeatmap.sliders = sliders;
    mappoolMap.customBeatmap.spinners = spinners;
    mappoolMap.customBeatmap.maxCombo = maxCombo;
    mappoolMap.customBeatmap.aimSR = aimSR;
    mappoolMap.customBeatmap.speedSR = speedSR;
    mappoolMap.customBeatmap.totalSR = sr;
    mappoolMap.customBeatmap.mode = tournament.mode;

    const customThread = await getCustomThread(m, mappoolMap, tournament, mappoolSlot);
    if (!customThread)
        return;
    if (customThread !== true) {
        const [ thread ] = customThread;
        const forumChannel = await discordClient.channels.fetch(thread.parentId!) as ForumChannel;
        const finishedTag = forumChannel.availableTags.find(tag => tag.name.toLowerCase() === "finished");
        const wipTag = forumChannel.availableTags.find(tag => tag.name.toLowerCase() === "wip");
        if (!thread.appliedTags.some(tag => tag === finishedTag?.id || tag === wipTag?.id)) {
            thread.appliedTags.push(wipTag!.id);
            await thread.setAppliedTags(thread.appliedTags);
        }
    }

    await mappoolMap.customBeatmap.save();
    await mappoolMap.save();

    await deletePack("mappacksTemp", mappool);

    const log = new MappoolMapHistory();
    log.createdBy = user;
    log.mappoolMap = mappoolMap;
    log.artist = artist;
    log.title = title;
    log.difficulty = diff;
    log.link = link;
    await log.save();

    const apiBeatmap = new APIBeatmap({
        "beatmapset_id": "-1",
        "beatmap_id": "-1",
        "approved": "-3",
        "total_length": `${mappoolMap.customBeatmap.totalLength}`,
        "hit_length": `${mappoolMap.customBeatmap.hitLength}`,
        "version": mappoolMap.customBeatmap.difficulty,
        "file_md5": "",
        "diff_size": `${mappoolMap.customBeatmap.circleSize}`,
        "diff_overall": `${mappoolMap.customBeatmap.overallDifficulty}`,
        "diff_approach": `${mappoolMap.customBeatmap.approachRate}`,
        "diff_drain": `${mappoolMap.customBeatmap.hpDrain}`,
        "mode": `${mappoolMap.customBeatmap.mode.ID - 1}`,
        "count_normal": `${mappoolMap.customBeatmap.circles}`,
        "count_slider": `${mappoolMap.customBeatmap.sliders}`,
        "count_spinner": `${mappoolMap.customBeatmap.spinners}`,
        "submit_date": [
            mappoolMap.createdAt.getUTCMonth() + 1,
            mappoolMap.createdAt.getUTCDate(),
            mappoolMap.createdAt.getUTCFullYear(),
        ].join("/") + " " + [
            mappoolMap.createdAt.getUTCHours(),
            mappoolMap.createdAt.getUTCMinutes(),
            mappoolMap.createdAt.getUTCSeconds(),
        ].join(":"),
        "approved_date": null,
        "last_update": [
            mappoolMap.lastUpdate.getUTCMonth() + 1,
            mappoolMap.lastUpdate.getUTCDate(),
            mappoolMap.lastUpdate.getUTCFullYear(),
        ].join("/") + " " + [
            mappoolMap.lastUpdate.getUTCHours(),
            mappoolMap.lastUpdate.getUTCMinutes(),
            mappoolMap.lastUpdate.getUTCSeconds(),
        ].join(":"),
        "artist": mappoolMap.customBeatmap.artist,
        "artist_unicode": mappoolMap.customBeatmap.artist,
        "title": mappoolMap.customBeatmap.title,
        "title_unicode": mappoolMap.customBeatmap.title,
        "creator": mappoolMap.customMappers.map(u => u.osu.username).join(", "),
        "creator_id": "-1",
        "bpm": `${mappoolMap.customBeatmap.BPM}`,
        "source": "",
        "tags": `${mappoolMap.customBeatmap.link ?? ""}`,
        "genre_id": "0",
        "language_id": "0",
        "favourite_count": "0",
        "rating": "0",
        "storyboard": "0",
        "video": "0",
        "download_unavailable": "0",
        "audio_unavailable": "0",
        "playcount": "0",
        "passcount": "0",
        "packs": null,
        "max_combo": mappoolMap.customBeatmap.maxCombo ? `${mappoolMap.customBeatmap.maxCombo}` : null,
        "diff_aim": mappoolMap.customBeatmap.aimSR ? `${mappoolMap.customBeatmap.aimSR}` : null,
        "diff_speed": mappoolMap.customBeatmap.speedSR ? `${mappoolMap.customBeatmap.speedSR}` : null,
        "difficultyrating": `${mappoolMap.customBeatmap.totalSR}`,
    });
    const set = [apiBeatmap];
    const mappoolMapEmbed = await beatmapEmbed(applyMods(apiBeatmap, modsToAcronym(slot.allowedMods || 0)), modsToAcronym(slot.allowedMods || 0), set);
    mappoolMapEmbed.data.author!.name = `${mappoolSlot}: ${mappoolMapEmbed.data.author!.name}`;

    await respond(m, `Submitted \`${artist} - ${title} [${diff}]\` to \`${mappoolSlot}\``, [mappoolMapEmbed]);

    await mappoolLog(tournament, "submit", user, log, mappoolSlot);
}