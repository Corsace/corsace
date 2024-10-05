import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import { loginResponse } from "../../../functions/loginResponse";
import { extractParameters } from "../../../functions/parameterFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { Tournament, unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import confirmCommand from "../../../functions/confirmCommand";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { acronymtoMods } from "../../../../Interfaces/mods";
import { User } from "../../../../Models/user";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { deletePack } from "../../../../Server/functions/tournaments/mappool/mappackFunctions";
import channelID from "../../../functions/channelID";
import { TournamentRoleType } from "../../../../Interfaces/tournament";

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
        (m instanceof Message && m.content.split(" ").length === 3) ||
        (m instanceof ChatInputCommandInteraction && m.options.getSubcommand() === "map")
    )
        params = await extractParameters<parametersMap>(m, [
            { name: "pool", paramType: "string" },
            { name: "slot", paramType: "string", postProcess: postProcessSlotOrder },
        ]);
    else
        params = await extractParameters<parametersSlot>(m, [
            { name: "pool", paramType: "string" },
            { name: "slot_acronym", paramType: "string" },
            { name: "slot_name", paramType: "string" },
            { name: "amount", paramType: "integer" },
            { name: "mods", paramType: "string", optional: true },
            { name: "user_mod_count", paramType: "integer", optional: true },
            { name: "unique_mod_count", paramType: "integer", optional: true },
        ]);
    if (!params)
        return;

    const components = await mappoolComponents(m, params.pool, true, true, true, { text: channelID(m), searchType: "channel" }, unFinishedTournaments);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;
    const slots = mappool.slots;

    if ("slot" in params) {
        await addMap(m, params, mappool, slots, user, tournament);
        return;
    }

    await addSlot(m, params, mappool, slots, user, tournament);
}

async function addMap (m: Message | ChatInputCommandInteraction, params: parametersMap, mappool: Mappool, slots: MappoolSlot[], user: User, tournament: Tournament) {
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

    if (order >= 10) {
        await respond(m, `The maximum amount of maps in a slot is 9`);
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

    await Promise.all([
        deletePack("mappacksTemp", mappool),
        respond(m, `Added **${diff}** maps to **${slot}**`),
        mappoolLog(tournament, "addMap", user, `Added \`${diff}\` maps to \`${slot}\``),
    ]);
    return;
}

async function addSlot (m: Message | ChatInputCommandInteraction, params: parametersSlot, mappool: Mappool, slots: MappoolSlot[], user: User, tournament: Tournament) {
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

    if (amount >= 10) {
        await respond(m, `The maximum amount of maps in a slot is 9`);
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
        map.createdBy = user;
        map.order = i + 1;
        slot.maps.push(map);
    }
    if (modNum) slot.allowedMods = modNum;
    if (user_mod_count) slot.userModCount = user_mod_count;
    if (unique_mod_count) slot.uniqueModCount = unique_mod_count;
    mappool.slots.push(slot);

    await deletePack("mappacksTemp", mappool);

    await mappool.save();
    for (const s of mappool.slots) {
        s.mappool = mappool;
        await s.save();
        for (const map of s.maps) {
            map.slot = s;
            await map.save();
        }
    }

    await Promise.all ([
        respond(m, `Added **${amount}** maps to a new slot called **${slot_name} (${slot_acronym})** in **${mappool.abbreviation.toUpperCase()}**`),
        mappoolLog(tournament, "addSlot", user, `Added \`${amount}\` maps to a new slot called \`${slot_name} (${slot_acronym})\` in \`${mappool.abbreviation.toUpperCase()}\``),
    ]);
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