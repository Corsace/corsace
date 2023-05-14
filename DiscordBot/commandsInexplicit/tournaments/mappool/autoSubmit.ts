import { GuildMemberRoleManager, Message } from "discord.js";
import { TournamentChannel, TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { Tournament, TournamentStatus } from "../../../../Models/tournaments/tournament";
import Axios from "axios";
import osu from "ojsama";
import { Entry, Parse } from "unzipper";
import { once } from "events";
import { BeatmapParser } from "../../../../Server/beatmapParser";
import { Brackets } from "typeorm";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { deletePack, fetchCustomThread, mappoolLog } from "../../../functions/tournamentFunctions";
import { TournamentRole, TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { User } from "../../../../Models/user";
import { MappoolMapHistory } from "../../../../Models/tournaments/mappools/mappoolMapHistory";
import { Beatmap as APIBeatmap} from "nodesu";
import beatmapEmbed from "../../../functions/beatmapEmbed";
import { applyMods, modsToAcronym } from "../../../../Interfaces/mods";
import { CustomBeatmap } from "../../../../Models/tournaments/mappools/customBeatmap";

export default async function autoSubmit (m: Message) {
    if (!m.guild)
        return;

    // Check if an osz attachment is sent with the message
    let link = "";
    if (m.attachments.first())
        link = m.attachments.first()!.url;
    else if (/https?:\/\/\S+/.test(m.content))
        link = /https?:\/\/\S+/.exec(m.content)![0];
    else
        return;

    // Check if the link is an osz file
    if (!link.endsWith(".osz"))
        return;
    
    const channel = await TournamentChannel.findOne({
        where: {
            channelID: m.channel && m.channel.isThread() ? m.channel.parentId! : m.channelId,
        },
    });
    if (!channel)
        return;

    const allowedChannels = [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers];
    const allowed = allowedChannels.some(t => t === channel.channelType);
    if (!allowed)
        return;

    const tournaments = await Tournament.createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.mode", "mode")
        .leftJoin("tournament.channels", "channel")
        .where("tournament.server = :server", { server: m.guild.id })
        .andWhere("channel.channelID = :channelID", { channelID: m.channel && m.channel.isThread() ? m.channel.parentId! : m.channelId })
        .andWhere("tournament.status IN (:...status)", { status: [ TournamentStatus.NotStarted, TournamentStatus.Ongoing, TournamentStatus.Registrations ]})
        .getMany();
    
    if (tournaments.length !== 1)
        return;

    const tournament = tournaments[0];

    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    let bypass = false;
    const bypassRoleFilter = roles.filter(role => role.roleType === TournamentRoleType.Organizer || role.roleType === TournamentRoleType.Mappoolers);
    if (bypassRoleFilter.length > 0)
        bypass = (m.member!.roles as GuildMemberRoleManager).cache.hasAny(...bypassRoleFilter.map(r => r.roleID));

    if (!bypass) {
        const roleFilter = roles.filter(role => role.roleType === TournamentRoleType.Mappers);
        if (roleFilter.length === 0)
            return;

        const allowed = (m.member!.roles as GuildMemberRoleManager).cache.hasAny(...roleFilter.map(r => r.roleID));
        if (!allowed)
            return;
    }

    const user = await User.findOne({
        where: {
            discord: {
                userID: m.author.id,
            }
        }
    });
    if (!user)
        return;

    // Obtain beatmap data
    const diffRegex = /-d (.+)/;
    const diffMatch = diffRegex.exec(m.content);
    let diffText = "";
    if (diffMatch)
        diffText = diffMatch[1];
    let beatmap: osu.beatmap | undefined = undefined;
    let axiosData: any = null;
    try {
        const { data } = await Axios.get(link, { responseType: "stream" });
        axiosData = data;
    } catch (e) {
        m.reply("Could not download the map. Please make sure the link is valid.");
        return;
    }
    const zip = axiosData.pipe(Parse({ forceStream: true }));
    const osuParser = new osu.parser();
    for await (const _entry of zip) {
        const entry = _entry as Entry;

        if (entry.type === "File" && entry.props.path.endsWith(".osu")) {
            const writableBeatmapParser = new BeatmapParser(osuParser);
            entry.pipe(writableBeatmapParser);
            await once(writableBeatmapParser, "finish");
            
            if (diffText !== "" && osuParser.map.version.toLowerCase() !== diffText.toLowerCase())
                continue;

            beatmap = osuParser.map;
            break;
        }

        entry.autodrain();
    }
    if (!beatmap)
        return;
    
    const artist = beatmap.artist;
    const title = beatmap.title;
    const diff = beatmap.version;

    const mappoolMaps = await MappoolMap
        .createQueryBuilder("map")
        .leftJoinAndSelect("map.customMappers", "customMapper")
        .leftJoinAndSelect("map.testplayers", "testplayer")
        .leftJoinAndSelect("map.customBeatmap", "customBeatmap")
        .leftJoinAndSelect("customBeatmap.mode", "mode")
        .leftJoinAndSelect("map.slot", "slot")
        .leftJoinAndSelect("slot.mappool", "mappool")
        .leftJoinAndSelect("mappool.round", "round")
        .leftJoinAndSelect("mappool.stage", "stage")
        .leftJoinAndSelect("stage.tournament", "tournament")
        .where("tournament.id = :tournamentID", { tournamentID: tournament.ID })
        .andWhere(new Brackets(qb => {
            qb
                .where(new Brackets(qb2 => {
                    qb2.where("customBeatmap.artist LIKE :artist", { artist: `%${artist}%` })
                        .andWhere("customBeatmap.title LIKE :title", { title: `%${title}%` })
                        .andWhere("customBeatmap.difficulty LIKE :diff", { diff: `%${diff}%` });
                }))
                .orWhere("map.customThreadID = :threadID", { threadID: m.channel.id });
        }))
        .getMany();
    
    if (mappoolMaps.length !== 1)
        return;

    const mappoolMap = mappoolMaps[0];
    if (mappoolMap.slot.mappool.isPublic)
        return;

    if (!mappoolMap.customBeatmap)
        mappoolMap.customBeatmap = new CustomBeatmap();

    const slot = mappoolMap.slot;

    const cs = beatmap.cs;
    const ar = beatmap.ar ?? -1;
    const od = beatmap.od;
    const hp = beatmap.hp;
    const circles = beatmap.objects.filter(object => object.type === osu.objtypes.circle).length;
    const sliders = beatmap.objects.filter(object => object.type === osu.objtypes.slider).length;
    const spinners = beatmap.objects.filter(object => object.type === osu.objtypes.spinner).length;
    const maxCombo = beatmap.max_combo();

    // Obtaining length
    const lengthMs = beatmap.objects[beatmap.objects.length - 1].time - beatmap.objects[0].time;
    const length = lengthMs / 1000;

    // Obtaining bpm
    const changedLines = beatmap.timing_points.filter(line => line.change === true);
    const timingPoints = changedLines.map((line, i) => {
        return {
            bpm: 60000 / line.ms_per_beat,
            length: (i < changedLines.length - 1) ? changedLines[i+1].time - line.time : beatmap!.objects[beatmap!.objects.length - 1].time - line.time,
        };
    });
    let bpm = 0;
    if (timingPoints.length === 1)
        bpm = timingPoints[0].bpm;
    else
        bpm = timingPoints.reduce((acc, curr) => acc + curr.length * curr.bpm, 0) / timingPoints.reduce((acc, curr) => acc + curr.length, 0);

    // Obtaining star rating
    const calc = new osu.std_diff().calc({map: beatmap, mods: slot.allowedMods});
    const aimSR = calc.aim;
    const speedSR = calc.speed;
    const sr = calc.total;

    mappoolMap.customBeatmap.link = link;
    mappoolMap.customBeatmap.artist = artist;
    mappoolMap.customBeatmap.title = title;
    mappoolMap.customBeatmap.BPM = bpm;
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

    const customThread = await fetchCustomThread(m, mappoolMap, tournament, `${mappoolMap.slot.mappool.abbreviation.toUpperCase()} ${slot}${mappoolMap.order}`);
    if (!customThread)
        return;

    await mappoolMap.customBeatmap.save();
    await mappoolMap.save();

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
        "submit_date": [mappoolMap.createdAt.getUTCMonth()+1,
            mappoolMap.createdAt.getUTCDate(),
            mappoolMap.createdAt.getUTCFullYear()].join('/')+' '+
           [mappoolMap.createdAt.getUTCHours(),
            mappoolMap.createdAt.getUTCMinutes(),
            mappoolMap.createdAt.getUTCSeconds()].join(':'),
        "approved_date": null,
        "last_update": [mappoolMap.lastUpdate.getUTCMonth()+1,
            mappoolMap.lastUpdate.getUTCDate(),
            mappoolMap.lastUpdate.getUTCFullYear()].join('/')+' '+
           [mappoolMap.lastUpdate.getUTCHours(),
            mappoolMap.lastUpdate.getUTCMinutes(),
            mappoolMap.lastUpdate.getUTCSeconds()].join(':'),
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
    const mappoolMapEmbed = await beatmapEmbed(applyMods(apiBeatmap, modsToAcronym(mappoolMap.slot.allowedMods ?? 0)), modsToAcronym(slot.allowedMods ?? 0), set);
    mappoolMapEmbed.data.author!.name = `${slot.acronym.toUpperCase()}${mappoolMap.order}: ${mappoolMapEmbed.data.author!.name}`;
    
    const mappool = mappoolMap.slot.mappool;
    await deletePack("mappacksTemp", mappool);
    mappool.mappack = mappool.mappackExpiry = null;
    await mappool.save();

    m.reply({
        content: `Successfully submitted **${artist} - ${title} [${diff}]** to **${mappool.abbreviation.toUpperCase()} ${slot.acronym.toUpperCase()}${mappoolMap.order}**`,
        embeds: [mappoolMapEmbed],
    });

    await mappoolLog(tournament, "submit", user, log, slot, mappool);
    return;
}