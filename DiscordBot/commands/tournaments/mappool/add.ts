import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { Command } from "../../index";
import { loginResponse } from "../../../functions/loginResponse";
import { extractParameters } from "../../../functions/parameterFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import confirmCommand from "../../../functions/confirmCommand";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";

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

    let params: parametersSlot | parametersMap | undefined = undefined;
    if (
        (m instanceof Message && m.content.split(" ").length === 3) ||
        (m instanceof ChatInputCommandInteraction && m.options.getSubcommand() === "map")
    ) {
        params = extractParameters<parametersMap>(m, [
            { name: "pool", regex: /-p (\S+)/, regexIndex: 1 },
            { name: "slot", regex: /-s (\S+)/, regexIndex: 1, postProcess: postProcessSlotOrder },
        ]);
    } else {
        params = extractParameters<parametersSlot>(m, [
            { name: "pool", regex: /-p (\S+)/, regexIndex: 1 },
            { name: "slot_name", regex: /-n (\S+)/, regexIndex: 1 },
            { name: "slot_acronym", regex: /-a (\S+)/, regexIndex: 1 },
            { name: "amount", regex: /-c (\d+)/, regexIndex: 1, paramType: "integer" },
            { name: "mods", regex: /-m (\S+)/, regexIndex: 1, optional: true },
            { name: "user_mod_count", regex: /-u (\d+)/, regexIndex: 1, paramType: "integer", optional: true },
            { name: "unique_mod_count", regex: /-r (\d+)/, regexIndex: 1, paramType: "integer", optional: true },
        ]);
    }
    if (!params)
        return;

    const components = await mappoolComponents(m, params.pool, true, true, true, { text: m.channelId, searchType: "channel" }, unFinishedTournaments);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;
    const slots = mappool.slots;

    if ("slot" in params) {
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

        if (!await confirmCommand(m, `Are u sure u wanna add ${order - slotMod.maps.length} maps to ${slot}? There's currently ${slotMod.maps.length} maps in the slot`)) {
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

        await respond(m, `Added ${order - slotMod.maps.length} maps to ${slot}`);

        await mappoolLog(tournament, "addMap", user, `Added ${order - slotMod.maps.length} maps to ${slot}`);
        return;
    }

    const { slot_name, slot_acronym, amount, mods, user_mod_count, unique_mod_count } = params;

    const slot = slots.find(s => slot_name.toLowerCase() === s.name.toLowerCase() || slot_acronym.toLowerCase() === s.acronym.toLowerCase());
    if (slot) {
        await respond(m, `Slot \`${slot_name} ${slot_acronym}\` already exists`);
        return;
    }

    if (!await confirmCommand(m, `Are u sure u wanna add ${amount} maps to ${slot_name} ${slot_acronym} in the ${mappool.abbreviation.toUpperCase()} pool?`)) {
        await respond(m, "Ok .");
        return;
    }

    
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
                    .setName("slot_name")
                    .setDescription("The slot to add.")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("slot_acronym")
                    .setDescription("The acronym for the slot.")
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