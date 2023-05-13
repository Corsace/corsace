import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { confirmCommand, fetchMappool, fetchTournament, hasTournamentRoles, mappoolLog } from "../../../functions/tournamentFunctions";
import { Command } from "../../index";
import { User } from "../../../../Models/user";
import { loginResponse } from "../../../functions/loginResponse";
import { buckets } from "../../../../Server/s3";
import { randomUUID } from "crypto";
import { download } from "../../../../Server/utils/download";
import { zipFiles } from "../../../../Server/utils/zip";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild)
        return;

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();
    else
        await m.react("⏳");

    const tournament = await fetchTournament(m);
    if (!tournament) 
        return;

    const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]);
    if (!allowed) 
        return;

    const user = await User.findOne({
        where: {
            discord: {
                userID: m instanceof Message ? m.author.id : m.user.id,
            }
        }
    })
    if (!user) {
        await loginResponse(m);
        return;
    }

    const poolRegex = /-p (\S+)/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    if (!poolText) {
        if (m instanceof Message) m.reply("Missing parameters. Please use `-p <pool>` or `<pool>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        else m.editReply("Missing parameters. Please use `-p <pool>` or `<pool>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[0];

    const mappool = await fetchMappool(m, tournament, pool, true, true, true);
    if (!mappool) 
        return;

    // Confirmations
    if (!mappool.isPublic && mappool.stage.timespan.start.getTime() - Date.now() > 1000 * 60 * 60 * 24 * 7) {
        const confirm = await confirmCommand(m, "This mappool is more than a week away from the stage's start date. Are you sure you want to publish it?");
        if (!confirm)
            return;
    } 
    if (!mappool.isPublic && mappool.slots.some(slot => slot.maps.some(map => !map.beatmap && !map.customBeatmap))) {
        const confirm = await confirmCommand(m, "This mappool still contains empty slots. Are you sure you want to publish it?");
        if (!confirm)
            return;
    }
    if (mappool.isPublic && mappool.stage.timespan.start.getTime() < Date.now()) {
        const confirm = await confirmCommand(m, "This mappool's stage has already started. Are you sure you want to privatize it?");
        if (!confirm)
            return;
    }

    if (mappool.isPublic) {
        // Reset link before making it private
        await buckets.mappacks.deleteObject(mappool.s3Key!);
        mappool.s3Key = mappool.link = mappool.linkExpiry = null;
        mappool.isPublic = false;

        await mappool.save();

        if (m instanceof Message) m.reply(`**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now private`);
        else m.editReply(`**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now private`);

        await mappoolLog(tournament, "publish", user, `**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now private`);

        return;
    }

    const s3Key = mappool.s3Key || `${randomUUID()}/${tournament.abbreviation.toUpperCase()}${tournament.year} ${mappool.abbreviation.toUpperCase()}.zip`;

    const mappack = await buckets.mappacksTemp.getObject(s3Key);
    if (mappack) {
        await buckets.mappacksTemp.deleteObject(s3Key);
        await buckets.mappacks.putObject(s3Key, mappack);
    } else {
        const mappoolMaps = mappool.slots.flatMap(s => s.maps);
        const filteredMaps = mappoolMaps.filter(m => (m.customBeatmap && m.customBeatmap.link) || m.beatmap);
        if (filteredMaps.length === 0) {
            if (m instanceof Message) m.reply(`**${pool}** does not have any downloadable beatmaps.`);
            else m.editReply(`**${pool}** does not have any downloadable beatmaps.`);
            return;
        }

        const names = filteredMaps.map(m => m.beatmap ? `${m.beatmap.beatmapset.ID} ${m.beatmap.beatmapset.artist} - ${m.beatmap.beatmapset.title}.osz` : `${m.customBeatmap!.ID} ${m.customBeatmap!.artist} - ${m.customBeatmap!.title}.osz`);
        const dlLinks = filteredMaps.map(m => m.customBeatmap ? m.customBeatmap.link! : `https://osu.direct/api/d/${m.beatmap!.beatmapsetID}n`);

        const streams = dlLinks.map(m => download(m));
        const zipStream = zipFiles(streams.map((d, i) => ({ content: d, name: names[i] })));
        await buckets.mappacks.putObject(s3Key, zipStream, "application/zip");
    }

    const url = await buckets.mappacks.getPublicUrl(mappool.s3Key!);
    mappool.link = url;
    mappool.linkExpiry = null;
    mappool.s3Key = s3Key;

    await mappool.save();

    if (m instanceof Message) m.reply(`**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now ${mappool.isPublic ? "public" : "private"}`);
    else m.editReply(`**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now ${mappool.isPublic ? "public" : "private"}`);

    await mappoolLog(tournament, "publish", user, `**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now ${mappool.isPublic ? "public" : "private"}`);

    if (m instanceof Message) m.reactions.cache.get("⏳")?.remove();
}

const data = new SlashCommandBuilder()
    .setName("mappool_publish")
    .setDescription("Publishes/privatizes a mappool")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to publish/private")
            .setRequired(true))
    .setDMPermission(false);  

const mappoolPublish: Command = {
    data,
    alternativeNames: [ "publish_mappool", "mappool-publish", "publish-mappool", "mappoolpublish", "publishmappool", "publishp", "ppublish", "pool_publish", "publish_pool", "pool-publish", "publish-pool", "poolpublish", "publishpool", "mappool_pub", "pub_mappool", "mappool-pub", "pub-mappool", "mappoolpub", "pubmappool", "pubp", "ppub", "pool_pub", "pub_pool", "pool-pub", "pub-pool", "poolpub", "pubpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolPublish;