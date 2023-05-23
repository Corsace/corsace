import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { Command } from "../../index";
import { loginResponse } from "../../../functions/loginResponse";
import { buckets } from "../../../../Server/s3";
import { gets3Key } from "../../../../Server/utils/s3";
import { createPack, deletePack } from "../../../functions/tournamentFunctions/mappackFunctions";
import { extractParameter } from "../../../functions/parameterFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import confirmCommand from "../../../functions/confirmCommand";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const pool = extractParameter(m, { name: "pool", regex: /-p (\S+)/, regexIndex: 1 }, 1);
    if (!pool || !(typeof pool === "string")) {
        await respond(m, "Please provide a mappool.");
        return;
    }

    const components = await mappoolComponents(m, pool, undefined, undefined, false, undefined, unFinishedTournaments, true);
    if (!components || !("mappool" in components) || !("stage" in components))
        return;

    const { tournament, mappool, stage } = components;

    // Confirmations
    if (!mappool.isPublic && stage!.timespan.start.getTime() - Date.now() > 1000 * 60 * 60 * 24 * 7) {
        const confirm = await confirmCommand(m, "This mappool is more than a week away from the stage's start date. Are you sure you want to publish it?");
        if (!confirm)
            return;
    } 
    if (!mappool.isPublic && mappool.slots.some(slot => slot.maps.some(map => !map.beatmap && !map.customBeatmap))) {
        const confirm = await confirmCommand(m, "This mappool still contains empty slots. Are you sure you want to publish it?");
        if (!confirm)
            return;
    }
    if (mappool.isPublic && stage!.timespan.start.getTime() < Date.now()) {
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

        await respond(m, `**${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})** is now **private**`);

        await mappoolLog(tournament, "publish", user, `\`${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})\` is now \`private\``);

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
            await respond(m, "Something went wrong while copying the mappack. Contact VINXIS.");
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

    await respond(m, `**${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})** is now **public**\nMappack: ${mappool.mappackLink}`);

    await mappoolLog(tournament, "publish", user, `\`${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})\` is now \`public\`\nMappack: ${mappool.mappackLink}`);

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