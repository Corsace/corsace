import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { confirmCommand, fetchMappool, fetchTournament, hasTournamentRoles, mappoolLog } from "../../../functions/tournamentFunctions";
import { Command } from "../../index";
import { User } from "../../../../Models/user";
import { loginResponse } from "../../../functions/loginResponse";
import { buckets } from "../../../../Server/s3";
import { gets3Key } from "../../../../Server/utils/s3";
import { createPack, deletePack } from "../../../functions/mappackFunctions";

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
        await deletePack("mappacks", mappool);
        mappool.mappackLink = mappool.mappackExpiry = null;
        mappool.isPublic = false;

        await mappool.save();

        if (m instanceof Message) m.reply(`**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now private`);
        else m.editReply(`**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now private`);

        await mappoolLog(tournament, "publish", user, `**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now private`);

        return;
    }
    
    if (m instanceof Message) await m.react("⏳");

    const s3Key = gets3Key("mappacksTemp", mappool);
    if (mappool.mappackLink && (mappool.mappackExpiry?.getTime() ?? -1) > Date.now() && s3Key) {
        // Copy mappack from temp to public
        try {
            await buckets.mappacks.copyObject(s3Key, buckets.mappacksTemp, s3Key, "application/zip");
            await buckets.mappacksTemp.deleteObject(s3Key);
        
            mappool.mappackLink = await buckets.mappacks.getPublicUrl(s3Key);
        } catch (err) {
            if (m instanceof Message) await m.reply("Something went wrong while copying the mappack. Contact VINXIS.");
            else await m.editReply("Something went wrong while copying the mappack. Contact VINXIS.");
            console.log(err);
            return;
        }
    } else {
        const url = await createPack(m, "mappacks", mappool, `${tournament.abbreviation.toUpperCase()}${tournament.year}_${mappool.abbreviation.toUpperCase()}`);
        if (!url)
            return;

        mappool.mappackLink = url;
    }
    
    mappool.mappackExpiry = null;
    mappool.isPublic = true;
    await mappool.save();

    if (m instanceof Message) m.reply(`**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now ${mappool.isPublic ? "public" : "private"}.\nMappack: ${mappool.mappackLink}`);
    else m.editReply(`**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now ${mappool.isPublic ? "public" : "private"}\nMappack: ${mappool.mappackLink}`);

    await mappoolLog(tournament, "publish", user, `**${mappool.name.toUpperCase()}** (${mappool.abbreviation.toUpperCase()}) is now ${mappool.isPublic ? "public" : "private"}\nMappack: ${mappool.mappackLink}`);

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