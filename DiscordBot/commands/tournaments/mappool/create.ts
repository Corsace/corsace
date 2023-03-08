import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Message, MessageComponentInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../..";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { StageType } from "../../../../Models/tournaments/stage";
import { TournamentStatus } from "../../../../Models/tournaments/tournament";
import { fetchRound, fetchStage, fetchTournament } from "../../../functions/tournamentFunctions";
import { filter } from "../../../functions/messageInteractionFunctions";

async function run (m: Message | ChatInputCommandInteraction) {
    const tournament = await fetchTournament(m, [TournamentStatus.NotStarted, TournamentStatus.Ongoing, TournamentStatus.Registrations], true, true, true);
    if (!tournament)
        return;

    const stage = await fetchStage(m, tournament);
    if (!stage)
        return;
    
    const mappool = new Mappool();
    mappool.stage = stage;
    mappool.slots = [];
    const targetSR = m instanceof Message ? parseFloat(m.content.split(" ")[1]) : m.options.getNumber("target_sr");
    if (!targetSR || isNaN(targetSR)) {
        await m.reply("Invalid target SR.");
        return;
    }
    mappool.targetSR = targetSR;

    // If the stage is an elmination-type stage, then check if they want to make a mappool for a specific round for the stage; otherwise, just make a mappool for the stage
    if (stage.stageType === StageType.DoubleElimination || stage.stageType === StageType.SingleElimination) {
        // Ask if they want to make a mappool for a specific round, or just for the stage
        const round = await fetchRound(m, stage);
        if (round)
            mappool.round = round;
    }
    // Check if the stage/round already has a mappool
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

    const cont = await confirm(m, existingMappools);
    if (!cont)
        return;

    mappool.order = existingMappools.length + 1;

    const message = await m.channel!.send("Alright let's get started!");
    await mappoolSlots(message, mappool);

    if (m instanceof ChatInputCommandInteraction)
        await m.deleteReply();
}

// Function to confirm if they want to create another mappool for the same stage/round
async function confirm (m: Message | ChatInputCommandInteraction, existingMappools: Mappool[]): Promise<boolean> {
    if (existingMappools.length === 0)
        return true;

    const message = await m.channel!.send({
        content: `This stage/round already has ${existingMappools.length} mappools. Are you sure you want to create another?`,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("yes")
                        .setLabel("Yes")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId("no")
                        .setLabel("No")
                        .setStyle(ButtonStyle.Danger)),
        ],
    });

    return new Promise<boolean>(resolve => {
        const confirmationCollector = m.channel!.createMessageComponentCollector({ filter, time: 60000 });
        confirmationCollector.on("collect", async (msg: Message | MessageComponentInteraction) => {
            if (msg instanceof MessageComponentInteraction) {
                if (msg.customId === "yes") {
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(true);
                }
                else if (msg.customId === "no") {
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(false);
                }
            }
        });
    });
}

// This function asks the user for slots (slotname, slottype, and # of maps) for the mappool
async function mappoolSlots (m: Message, mappool: Mappool) {
    const slotMessage = await m.channel!.send({
        content: "Provide the acronym for the slot, followed by the name, and lastly the number of maps that will be in the slot. For example, `FM FreeMod 3` or `DT Double Time 4`",
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("stop")
                        .setLabel("STOP COMMAND")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId("done")
                        .setLabel("Done adding slots.")
                        .setStyle(ButtonStyle.Success)
                ),
        ],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    const slotNameCollector = m.channel!.createMessageCollector({ filter, time: 60000 });
    
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
        if (i.customId === "stop") {
            await i.reply("Mappool creation stopped.");
            stopped = true;
            componentCollector.stop();
            slotNameCollector.stop();
            return;	
        }
        if (i.customId === "done") {
            if (mappool.slots.length === 0) {
                await i.reply("You don't have any slots in the pool bro.");
                return;
            }
            await i.reply("Mappool slots are created.");
            stopped = true;
            componentCollector.stop();
            slotNameCollector.stop();
            await mappoolDone(m, mappool);
            return;
        }
    });

    slotNameCollector.on("collect", async (msg: Message) => {
        const slotInfo = msg.content.split(" ");
        if (slotInfo.length < 3) {
            await msg.reply("Please provide the slot name, followed by the slot type, and lastly the number of maps that will be in the slot.");
            return;
        }
        const acronym = slotInfo[0];
        const mapCount = parseInt(slotInfo[slotInfo.length - 1]);
        const slotName = slotInfo.slice(1, slotInfo.length - 1);
        if (isNaN(mapCount) || mapCount <= 0) {
            const reply = await msg.reply("Please provide a valid number of maps that will be in the slot.");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }
        if (acronym.length > 3) {
            const reply = await msg.reply("Please provide an acronym that is at most 3 characters long.");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }

        const slot = new MappoolSlot();
        slot.acronym = acronym;
        slot.name = slotName.join(" ");
        slot.maps = [];
        for (let i = 0; i < mapCount; i++) {
            const map = new MappoolMap();
            map.order = i + 1;
            slot.maps.push(map);
        }
        mappool.slots.push(slot);
        await msg.reply(`Slot ${slot.name} (${slot.acronym}) created with ${mapCount} maps added.`);
    });
    slotNameCollector.on("end", async () => {
        await slotMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
        return;
    });
}

async function mappoolDone (m: Message, mappool: Mappool) {
    await mappool.save();
    for (const slot of mappool.slots) {
        slot.mappool = mappool;
        await slot.save();
        for (const map of slot.maps) {
            map.slot = slot;
            await map.save();
        }
    }

    await m.reply("Mappool created! :tada:\nHere is the mappool embed:");
    const embed = new EmbedBuilder()
        .setTitle(`${mappool.round ? mappool.round.abbreviation : mappool.stage!.abbreviation}${mappool.order === 1 ? "" : "-" + mappool.order}`)
        .setDescription(`Target SR: ${mappool.targetSR}`)
        .addFields(
            mappool.slots.map((slot) => {
                return {
                    name: `${slot.acronym} - ${slot.name}`,
                    value: `${slot.maps.length} maps`,
                };
            }));

    await m.channel!.send({ embeds: [embed] });
}

const data = new SlashCommandBuilder()
    .setName("create_mappool")
    .setDescription("Creates a mappool for a given stage/round.")
    .addNumberOption((option) => 
        option
            .setName("target_sr")
            .setDescription("The target SR for the mappool.")
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

const mappoolCreate: Command = {
    data,
    alternativeNames: ["mappool_create", "create-mappool", "mappool-create", "mappoolcreate", "createmappool", "mappoolc", "cmappool", "pool_create", "create_pool", "pool-create", "create-pool", "poolcreate", "createpool", "createp", "pcreate", "poolc", "cpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};
    
export default mappoolCreate;