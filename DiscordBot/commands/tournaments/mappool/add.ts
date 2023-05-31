import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { Command } from "../../index";
import { loginResponse } from "../../../functions/loginResponse";
import { extractParameters } from "../../../functions/parameterFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { Tournament, unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import confirmCommand from "../../../functions/confirmCommand";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { acronymtoMods } from "../../../../Interfaces/mods";
import { User } from "../../../../Models/user";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { deletePack } from "../../../functions/tournamentFunctions/mappackFunctions";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, true, [], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    let params: parametersSlot | parametersMap | undefined = undefined;
    if (
        (m instanceof Message && 
            (m.content.split(" ").length === 3 ||
            (m.content.includes("-p ") && m.content.includes("-s "))) 
        ) ||
        (m instanceof ChatInputCommandInteraction && m.options.getSubcommand() === "map")
    )
        params = extractParameters<parametersMap>(m, [
            { name: "pool", regex: /-p ([^-]+)/, regexIndex: 1 },
            { name: "slot", regex: /-s ([^-]+)/, regexIndex: 1, postProcess: postProcessSlotOrder },
        ]);
    else
        params = extractParameters<parametersSlot>(m, [
            { name: "pool", regex: /-p ([^-]+)/, regexIndex: 1 },
            { name: "slot_acronym", regex: /-a ([^-]+)/, regexIndex: 1 },
            { name: "slot_name", regex: /-n ([^-]+)/, regexIndex: 1 },
            { name: "amount", regex: /-c (\d+)/, regexIndex: 1, paramType: "integer" },
            { name: "mods", regex: /-m ([^-]+)/, regexIndex: 1, optional: true },
            { name: "user_mod_count", regex: /-u (\d+)/, regexIndex: 1, paramType: "integer", optional: true },
            { name: "unique_mod_count", regex: /-r (\d+)/, regexIndex: 1, paramType: "integer", optional: true },
        ]);
    if (!params)
        return;

    const components = await mappoolComponents(m, params.pool, true, true, true, { text: m.channelId, searchType: "channel" }, unFinishedTournaments);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;
    const slots = mappool.slots;

    if ("slot" in params) {
        await handleMap(m, params, mappool, slots, user, tournament);
        return;
    }

    await handleSlot(m, params, mappool, slots, user, tournament);
}

async function handleMap (m: Message | ChatInputCommandInteraction, params: parametersMap, mappool: Mappool, slots: MappoolSlot[], user: User, tournament: Tournament) {
    const { slot, order } = params; 
    if (!order) {
        await respond(m, `Specify the map number with the slot, e.g. ${slot}2`);
        return;
    }
    
    const slotMod = slots.find(s => slot.toLowerCase() === s.name.toLowerCase() || slot.toLowerCase() === s.acronym.toLowerCase());
    if (!slotMod) {
        await respond(m, `Could not find \`${slot}\` in the mappool`);
        return;
    }

    if (order < slotMod.maps.length) {
        await respond(m, `**${slot}${order}** already exists`);
        return;
    }

    const diff = order - slotMod.maps.length;

    if (!await confirmCommand(m, `Are u sure u wanna add ${diff} maps to ${slot}? There's currently ${slotMod.maps.length} maps in the slot`)) {
        await respond(m, "Ok .");
        return;
    }

    for (let i = slotMod.maps.length + 1; i <= order; i++) {
        const map = new MappoolMap();
        map.createdBy = user;
        map.order = i;
        slotMod.maps.push(map);
    }

    await slotMod.save();
    for (const map of slotMod.maps) {
        map.slot = slotMod;
        await map.save();
    }

    await deletePack("mappacksTemp", mappool);

    await respond(m, `Added **${diff}** maps to **${slot}**`);

    await mappoolLog(tournament, "addMap", user, `Added \`${diff}\` maps to \`${slot}\``);
    return;
}

async function handleSlot (m: Message | ChatInputCommandInteraction, params: parametersSlot, mappool: Mappool, slots: MappoolSlot[], user: User, tournament: Tournament) {
    const { slot_name, slot_acronym, amount, mods, user_mod_count, unique_mod_count } = params;
    if (mods && mods.length % 2 !== 0) {
        await respond(m, "Invalid mods");
        return;
    }
    const modNum = mods ? acronymtoMods(mods) : undefined;

    let slot = slots.find(s => slot_name.toLowerCase() === s.name.toLowerCase() || slot_acronym.toLowerCase() === s.acronym.toLowerCase());
    if (slot) {
        await respond(m, `Slot \`${slot_name} ${slot_acronym}\` already exists`);
        return;
    }

    if (!await confirmCommand(m, `Are u sure u wanna add ${amount} maps to a slot called ${slot_name} (${slot_acronym}) in the ${mappool.abbreviation.toUpperCase()} pool?`)) {
        await respond(m, "Ok .");
        return;
    }

    slot = new MappoolSlot();
    slot.createdBy = user;
    slot.acronym = slot_acronym;
    slot.name = slot_name;
    slot.maps = [];
    for (let i = 0; i < amount; i++) {
        const map = new MappoolMap();
        map.createdBy = mappool.createdBy;
        map.order = i + 1;
        slot.maps.push(map);
    }
    if (modNum) slot.allowedMods = modNum;
    if (user_mod_count) slot.userModCount = user_mod_count;
    if (unique_mod_count) slot.uniqueModCount = unique_mod_count;
    mappool.slots.push(slot);

    await deletePack("mappacksTemp", mappool);

    await mappool.save();
    for (const slot of mappool.slots) {
        slot.mappool = mappool;
        await slot.save();
        for (const map of slot.maps) {
            map.slot = slot;
            await map.save();
        }
    }

    await respond(m, `Added **${amount}** maps to a new slot called **${slot_name} (${slot_acronym})** in **${mappool.abbreviation.toUpperCase()}**`);

    await mappoolLog(tournament, "addSlot", user, `Added \`${amount}\` maps to a new slot called \`${slot_name} (${slot_acronym})\` in \`${mappool.abbreviation.toUpperCase()}\``);
}

const data = new SlashCommandBuilder()
    .setName("mappool_add")
    .setDescription("Add a slot/map to a mappool.")
    .addSubcommand(subcommand =>
        subcommand
            .setName("slot")
            .setDescription("Add a slot to a mappool.")
            .addStringOption(option =>
                option
                    .setName("pool")
                    .setDescription("The mappool to add the slot to.")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("slot_acronym")
                    .setDescription("The acronym for the slot.")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("slot_name")
                    .setDescription("The slot to add.")
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName("amount")
                    .setDescription("The amount of maps to add to the slot.")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mods")
                    .setDescription("The allowed mods in the slot (Default: None).")
                    .setRequired(false)
            )
            .addIntegerOption(option =>
                option
                    .setName("user_mod_count")
                    .setDescription("The number of users that will require mods (Default: 0).")
                    .setRequired(false)
            )
            .addIntegerOption(option =>
                option
                    .setName("unique_mod_count")
                    .setDescription("The number of unique mods each team requires (Default: 0).")
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName("map")
            .setDescription("Add a map to a slot in a mappool.")
            .addStringOption(option =>
                option
                    .setName("pool")
                    .setDescription("The mappool to add the map to.")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("slot")
                    .setDescription("The slot to add.")
                    .setRequired(true)
            )
    )
    .setDMPermission(false);  

interface parametersSlot {
    pool: string,
    slot_name: string,
    slot_acronym: string,
    amount: number,
    mods?: string,
    user_mod_count?: number,
    unique_mod_count?: number,
}

interface parametersMap {
    pool: string,
    slot: string,
    order?: number,
}

const mappoolAdd: Command = {
    data,
    alternativeNames: [ "add_mappool", "mappool-add", "add-mappool", "mappooladd", "addmappool", "addp", "padd", "pool_add", "add_pool", "pool-add", "add-pool", "pooladd", "addpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolAdd;