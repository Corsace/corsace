import { Message, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ThreadChannel } from "discord.js";
import { Command } from "../../index";
import respond from "../../../functions/respond";
import { extractParameter } from "../../../functions/parameterFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import { loginResponse } from "../../../functions/loginResponse";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import channelID from "../../../functions/channelID";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { Tournament } from "../../../../Models/tournaments/tournament";
import editProperty from "../../../functions/tournamentFunctions/editProperty";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import { User } from "../../../../Models/user";
import getCustomThread from "../../../functions/tournamentFunctions/getCustomThread";
import { discordClient } from "../../../../Server/discord";
import { profanityFilter } from "../../../../Interfaces/comment";

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

    const pool = extractParameter(m, { name: "pool", paramType: "string" }, 1);
    if (!pool || !(typeof pool === "string")) {
        await respond(m, "Provide a mappool");
        return;
    }

    const components = await mappoolComponents(m, pool, true, true, true, { text: channelID(m), searchType: "channel" }, undefined, true);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;

    const message = await respond(m, "Ok let's edit w/e u wanna edit");

    let existingMappools: Mappool[];
    if (mappool.round)
        existingMappools = await Mappool.find({
            where: {
                stage: {
                    ID: mappool.stage.ID,
                },
                round: {
                    ID: mappool.round.ID,
                },
            },
        });
    else
        existingMappools = await Mappool.find({
            where: {
                stage: {
                    ID: mappool.stage.ID,
                },
            },
        });

    existingMappools = existingMappools.filter((existingPool) => existingPool.ID !== mappool.ID);

    await mappoolName(message, mappool, tournament, existingMappools, commandUser(m).id, user);
}

async function mappoolName (m: Message, mappool: Mappool, tournament: Tournament, existingMappools: Mappool[], userID: string, user: User) {
    const name = await editProperty(m, "name", "mappool", mappool.name, userID);
    if (!name)
        return;

    if (typeof name === "string") {
        if (name.length > 50 || name.length < 5) {
            const reply = await m.channel.send("The name must be between 5 and 50 characters");
            setTimeout(async () => (await reply.delete()), 5000);
            await mappoolName(m, mappool, tournament, existingMappools, userID, user);
            return;
        }
        if (existingMappools.some(pool => pool.name.toLowerCase() === name.toLowerCase())) {
            const reply = await m.channel.send("A mappool with that name already exists");
            setTimeout(async () => (await reply.delete()), 5000);
            await mappoolName(m, mappool, tournament, existingMappools, userID, user);
            return;
        }
        if (profanityFilter.test(name)) {
            const reply = await m.channel.send("This name is sus . Choose a better name .");
            setTimeout(async () => (await reply.delete()), 5000);
            await mappoolName(m, mappool, tournament, existingMappools, userID, user);
            return;
        }

        mappool.name = name;
    }

    await mappoolAbbreviation(m, mappool, tournament, existingMappools, userID, user);
}

async function mappoolAbbreviation (m: Message, mappool: Mappool, tournament: Tournament, existingMappools: Mappool[], userID: string, user: User) {
    const abbreviation = await editProperty(m, "abbreviation", "mappool", mappool.abbreviation, userID);
    if (!abbreviation)
        return;

    if (typeof abbreviation === "string") {
        if (abbreviation.length > 4 || abbreviation.length < 1) {
            const reply = await m.channel.send("The abbreviation must be between 1 and 4 characters");
            setTimeout(async () => (await reply.delete()), 5000);
            await mappoolAbbreviation(m, mappool, tournament, existingMappools, userID, user);
            return;
        }
        if (existingMappools.some(pool => pool.abbreviation.toLowerCase() === abbreviation.toLowerCase())) {
            const reply = await m.channel.send("A mappool with that abbreviation already exists");
            setTimeout(async () => (await reply.delete()), 5000);
            await mappoolAbbreviation(m, mappool, tournament, existingMappools, userID, user);
            return;
        }
        if (profanityFilter.test(abbreviation)) {
            const reply = await m.channel.send("This abbreviation is sus . Choose a better abbreviation .");
            setTimeout(async () => (await reply.delete()), 5000);
            await mappoolAbbreviation(m, mappool, tournament, existingMappools, userID, user);
            return;
        }

        mappool.abbreviation = abbreviation;
    }

    await mappoolTargetSR(m, mappool, tournament, userID, user);
}

async function mappoolTargetSR (m: Message, mappool: Mappool, tournament: Tournament, userID: string, user: User) {
    const targetSR = await editProperty(m, "target SR", "mappool", mappool.targetSR.toString(), userID);
    if (!targetSR)
        return;

    if (typeof targetSR === "string") {
        const targetSRNumber = parseFloat(targetSR);
        if (isNaN(targetSRNumber)) {
            const msg = await m.channel.send("That's not a valid number dude");
            setTimeout(() => msg.delete(), 5000);
            await mappoolTargetSR(m, mappool, tournament, userID, user);
            return;
        }

        mappool.targetSR = targetSRNumber;
    }

    await mappoolSave(m, mappool, tournament, user);
}

async function mappoolSave (m: Message, mappool: Mappool, tournament: Tournament, user: User) {
    await mappool.save();

    await updateMapThreads(m, mappool, tournament);

    const embed = new EmbedBuilder()
        .setTitle(`${mappool.name} (${mappool.abbreviation.toUpperCase()})`)
        .setDescription(`Target SR: ${mappool.targetSR}`)
        .addFields(
            mappool.slots.map((slot) => {
                return {
                    name: `${slot.acronym} - ${slot.name}`,
                    value: `${slot.maps.length} map${slot.maps.length > 1 ? "s" : ""}`,
                };
            }));

    await Promise.all([
        m.channel!.send({ embeds: [embed] }),
        mappoolLog(tournament, "mappoolEdit", user, `Edited mappool ${mappool.name} (${mappool.abbreviation.toUpperCase()})`),
    ]);
}

async function updateMapThreads (m: Message, mappool: Mappool, tournament: Tournament) {
    mappool.slots.forEach(async (slot) => {
        slot.maps.forEach(async (map) => {
            const mappoolSlot = `${mappool.abbreviation.toUpperCase()} ${slot.acronym.toUpperCase()}${slot.maps.length === 1 ? "" : map.order}`;
            if (map.customThreadID)
                await getCustomThread(m, map, tournament, mappoolSlot);
            if (map.jobPost?.jobBoardThread) {
                const ch = await discordClient.channels.fetch(map.jobPost.jobBoardThread) as ThreadChannel | null;
                if (ch)
                    await ch.setName(mappoolSlot);
            }
        });
    });
}

const data = new SlashCommandBuilder()
    .setName("mappool_edit")
    .setDescription("Edit a tournament's name, abbreviation, or target SR.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to edit")
            .setRequired(false));

const mappoolEdit: Command = {
    data,
    alternativeNames: [ "edit_mappool", "mappool-edit", "edit-mappool", "mappooledit", "editmappool", "editp", "pedit", "pool_edit", "edit_pool", "pool-edit", "edit-pool", "pooledit", "editpool", "mappool_e", "e_mappool", "mappool-e", "e-mappool", "mappoole", "emappool", "ep", "pe", "pool_e", "e_pool", "pool-e", "e-pool", "poole", "epool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolEdit;