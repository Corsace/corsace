import { Entry, Parse } from "unzipper";
import { once } from "events";
import { ChatInputCommandInteraction, GuildMemberRoleManager, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import { BeatmapParser } from "../../../../Server/beatmapParser";
import Axios from "axios";
import osu from "ojsama";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRole, TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { fetchCustomThread, fetchMappool, fetchSlot, fetchTournament, hasTournamentRoles, isSecuredChannel, mappoolLog } from "../../../functions/tournamentFunctions";
import { CustomBeatmap } from "../../../../Models/tournaments/mappools/customBeatmap";
import { MappoolMapHistory } from "../../../../Models/tournaments/mappools/mappoolMapHistory";
import { User } from "../../../../Models/user";
import { loginResponse } from "../../../functions/loginResponse";
import beatmapEmbed from "../../../functions/beatmapEmbed";
import { Beatmap as APIBeatmap } from "nodesu";
import { applyMods, modsToAcronym } from "../../../../Interfaces/mods";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild)
        return;

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const securedChannel = await isSecuredChannel(m, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers]);
    if (!securedChannel) 
        return;

    const tournament = await fetchTournament(m);
    if (!tournament) 
        return;

    const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers]);
    if (!allowed) 
        return;

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
        if (roleFilter.length === 0) {
            if (m instanceof Message) m.reply(`There are no valid roles for this tournament. Please add ${TournamentRoleType.Mappers.toString()} roles first.`);
            else m.editReply(`There are no valid roles for this tournament. Please add ${TournamentRoleType.Mappers.toString()} roles first.`);
            return;
        }
        const allowed = (m.member!.roles as GuildMemberRoleManager).cache.hasAny(...roleFilter.map(r => r.roleID));
        if (!allowed) {
            if (m instanceof Message) m.reply("You are not a mappooler or organizer for this tournament.");
            else m.editReply("You are not a mappooler or organizer for this tournament.");
            return;
        }
    }

    const user = await User.findOne({
        where: {
            discord: {
                userID: m instanceof Message ? m.author.id : m.user.id,
            }
        }
    });
    if (!user) {
        await loginResponse(m);
        return;
    }

    let link: string = "";
    if (m instanceof Message) {
        if (m.attachments.first())
            link = m.attachments.first()!.url;
        else if (/https?:\/\/\S+/.test(m.content))
            link = /https?:\/\/\S+/.exec(m.content)![0];
        else {
            m.reply("Please provide a link to the map.");
            return;
        }
    } else {
        const attachment = m.options.getAttachment("map");
        if (!attachment) {
            m.editReply("Please provide a link to the map.");
            return;
        }
        link = attachment.url;
    }

    if (!link.endsWith(".osz")) {
        if (m instanceof Message) m.reply("Please provide a proper .osz file.");
        else m.editReply("Please provide a proper .osz file.");
        return;
    }

    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const diffRegex = /-d (.+)/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[2] : m.options.getString("slot");
    const diffText = m instanceof Message ? m.content.match(diffRegex) ?? m.content.split(" ")[3] : m.options.getString("difficulty");
    if (!poolText || !slotText) {
        if (m instanceof Message) m.reply("Missing parameters. Please use `-p <pool> -s <slot> [-d difficulty]` or `<pool> <slot> [difficulty]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        else m.editReply("Missing parameters. Please use `-p <pool> -s <slot> [-d difficulty]` or `<pool> <slot> [difficulty]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[0];
    const order = parseInt(typeof slotText === "string" ? slotText.substring(slotText.length - 1) : slotText[1].substring(slotText[1].length - 1));
    const slot = (typeof slotText === "string" ? slotText.substring(0, slotText.length - 1) : slotText[1].substring(0, slotText[1].length - 1)).toUpperCase();
    let diff = !diffText ? "" : typeof diffText === "string" ? diffText.replace(/_/g, " ") : diffText[0].replace(/_/g, " ");

    if (isNaN(order)) {
        if (m instanceof Message) m.reply("Invalid slot number. Please use a valid slot number.");
        else m.editReply("Invalid slot number. Please use a valid slot number.");
        return;
    }

    const mappool = await fetchMappool(m, tournament, pool);
    if (!mappool) 
        return;
    const mappoolSlot = `${mappool.abbreviation.toUpperCase()} ${slot}${order}`;

    const slotMod = await fetchSlot(m, mappool, slot.toString(), true);
    if (!slotMod) 
        return;

    const mappoolMap = slotMod.maps.find(m => m.order === order);
    if (!mappoolMap) {
        if (m instanceof Message) m.reply(`Could not find map **${order}**`);
        else m.editReply(`Could not find map **${order}**`);
        return;
    }

    // Check if they are assigned to the map
    if (!bypass && !mappoolMap.customMappers.some(mapper => mapper.discord.userID !== (m instanceof Message ? m.author.id : m.user.id))) {
        if (m instanceof Message) m.reply("You are not assigned to this map.");
        else m.editReply("You are not assigned to this map.");
        return;
    }

    // Obtain beatmap data
    let artist = "";
    let title = "";
    let length = 0;
    let bpm = 0;
    let aimSR = 0;
    let speedSR = 0;
    let sr = 0;
    let cs = 0;
    let ar = 0;
    let od = 0;
    let hp = 0;
    let circles = 0;
    let sliders = 0;
    let spinners = 0;
    let maxCombo = 0;
    let axiosData: any = null;
    try {
        const { data } = await Axios.get(link, { responseType: "stream" });
        axiosData = data;
    } catch (e) {
        if (m instanceof Message) m.reply("Could not download the map. Please make sure the link is valid.");
        else m.editReply("Could not download the map. Please make sure the link is valid.");
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
            
            if (diff !== "" && osuParser.map.version.toLowerCase() !== diff.toLowerCase())
                continue;

            const beatmap = osuParser.map;
            artist = beatmap.artist;
            title = beatmap.title;
            diff = beatmap.version;
            cs = beatmap.cs;
            ar = beatmap.ar ?? -1;
            od = beatmap.od;
            hp = beatmap.hp;
            circles = beatmap.objects.filter(object => object.type === osu.objtypes.circle).length;
            sliders = beatmap.objects.filter(object => object.type === osu.objtypes.slider).length;
            spinners = beatmap.objects.filter(object => object.type === osu.objtypes.spinner).length;
            maxCombo = beatmap.max_combo();

            // Obtaining length
            const lengthMs = beatmap.objects[beatmap.objects.length - 1].time - beatmap.objects[0].time;
            length = lengthMs / 1000;

            // Obtaining bpm
            const changedLines = beatmap.timing_points.filter(line => line.change === true);
            const timingPoints = changedLines.map((line, i) => {
                return {
                    bpm: 60000 / line.ms_per_beat,
                    length: (i < changedLines.length - 1) ? changedLines[i+1].time - line.time : beatmap.objects[beatmap.objects.length - 1].time - line.time,
                };
            });
            if (timingPoints.length === 1)
                bpm = timingPoints[0].bpm;
            else
                bpm = timingPoints.reduce((acc, curr) => acc + curr.length * curr.bpm, 0) / timingPoints.reduce((acc, curr) => acc + curr.length, 0);

            // Obtaining star rating
            const calc = new osu.std_diff().calc({map: beatmap, mods: slotMod.allowedMods});
            aimSR = calc.aim;
            speedSR = calc.speed;
            sr = calc.total;
            break;
        }

        entry.autodrain();
    }

    if (artist === "") {
        if (m instanceof Message) m.reply(`Could not find **${diff !== "" ? `[${diff}]` : "a single difficulty(?)"}** in your osz`);
        else m.editReply(`Could not find **${diff !== "" ? `[${diff}]` : "a single difficulty(?)"}** in your osz`);
        return;
    }

    if (!mappoolMap.customBeatmap)
        mappoolMap.customBeatmap = new CustomBeatmap();

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

    const customThread = await fetchCustomThread(m, mappoolMap, tournament, mappoolSlot);
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
    const mappoolMapEmbed = await beatmapEmbed(applyMods(apiBeatmap, modsToAcronym(slotMod.allowedMods ?? 0)), modsToAcronym(slotMod.allowedMods ?? 0), set);
    mappoolMapEmbed.data.author!.name = `${mappoolSlot}: ${mappoolMapEmbed.data.author!.name}`;
    
    if (m instanceof Message) m.reply({
        content: `Successfully submitted **${artist} - ${title} [${diff}]** to **${mappoolSlot}**`,
        embeds: [mappoolMapEmbed],
    });
    else m.editReply({
        content: `Successfully submitted **${artist} - ${title} [${diff}]** to **${mappoolSlot}**`,
        embeds: [mappoolMapEmbed],
    });

    await mappoolLog(tournament, "submit", user, log, slotMod, mappool);
    return;
}

const data = new SlashCommandBuilder()
    .setName("mappool_submit")
    .setDescription("Submit a map to a mappool.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to submit to.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to submit to.")
            .setRequired(true))
    .addAttachmentOption(option =>
        option.setName("map")
            .setDescription("The map to submit.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("difficulty")
            .setDescription("The difficulty to submit. (Default: First difficulty it finds)")
            .setRequired(false))
    .setDMPermission(false);

const mappoolSubmit: Command = {
    data,
    alternativeNames: [ "submit_mappool", "mappool-submit", "submit-mappool", "mappoolsubmit", "submitmappool", "submitp", "psubmit", "pool_submit", "submit_pool", "pool-submit", "submit-pool", "poolsubmit", "submitpool", "mappool_s", "s_mappool", "mappool-s", "s-mappool", "mappools", "smappool", "sp", "ps", "pool_s", "s_pool", "pool-s", "s-pool", "pools", "spool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolSubmit;