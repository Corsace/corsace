import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import { loginResponse } from "../../../functions/loginResponse";
import { createPack, deletePack } from "../../../../Server/functions/tournaments/mappool/mappackFunctions";
import { extractParameter } from "../../../functions/parameterFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import confirmCommand from "../../../functions/confirmCommand";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import { TournamentRoleType } from "../../../../Interfaces/tournament";

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

    const pool = extractParameter(m, { name: "pool", paramType: "string" }, 1);
    if (!pool || !(typeof pool === "string")) {
        await respond(m, "Provide a mappool");
        return;
    }

    const components = await mappoolComponents(m, pool, true, true, false, undefined, unFinishedTournaments, true);
    if (!components || !("mappool" in components) || !("stage" in components)) {
        await respond(m, "Can't find mappool and stage. Provide a valid mappool");
        return;
    }

    const { tournament, mappool, stage } = components;

    // Confirmations
    if (!mappool.isPublic && stage!.timespan.start.getTime() - Date.now() > 1000 * 60 * 60 * 24 * 7) {
        const confirm = await confirmCommand(m, "This mappool is more than a week away from the stage's start date u sure u wanna publish it?");
        if (!confirm) {
            await respond(m, "Ok Lol . stopped mappool publish");
            return;
        }
    } 
    if (!mappool.isPublic && mappool.slots.some(slot => slot.maps.some(map => !map.beatmap))) {
        await respond(m, "The mappool still contains unfinished customs/empty slots add all uploaded maps first");
        return;
    }
    if (mappool.isPublic && stage!.timespan.start.getTime() < Date.now()) {
        const confirm = await confirmCommand(m, "This mappool's stage already started u sure u wanna privatize it?");
        if (!confirm) {
            await respond(m, "Ok Lol . stopped mappool unpublishing");
            return;
        }
    }

    if (mappool.isPublic) {
        // Reset link before making it private
        await deletePack("mappacks", mappool);

        mappool.isPublic = false;
        await mappool.save();

        await respond(m, `**${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})** is now **private**`);

        await mappoolLog(tournament, "publish", user, `\`${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})\` is now \`private\``);

        return;
    }
    
    if (m instanceof Message) await m.react("⏳");

    await deletePack("mappacksTemp", mappool);

    const url = await createPack(m, "mappacks", mappool, `${tournament.abbreviation.toUpperCase()}_${mappool.abbreviation.toUpperCase()}`);
    if (!url) {
        await respond(m, "Something died while creating the mappack and retrieving its URL. Contact VINXIS");
        return;
    }

    mappool.mappackLink = url;
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
    .addAttachmentOption(option =>
        option.setName("mappack")
            .setDescription("The mappack to upload")
            .setRequired(false))
    .setDMPermission(false);  

const mappoolPublish: Command = {
    data,
    alternativeNames: [ "publish_mappool", "mappool-publish", "publish-mappool", "mappoolpublish", "publishmappool", "publishp", "ppublish", "pool_publish", "publish_pool", "pool-publish", "publish-pool", "poolpublish", "publishpool", "mappool_pub", "pub_mappool", "mappool-pub", "pub-mappool", "mappoolpub", "pubmappool", "pubp", "ppub", "pool_pub", "pub_pool", "pool-pub", "pub-pool", "poolpub", "pubpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolPublish;