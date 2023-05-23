import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Message, MessageComponentInteraction, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { Command } from "../..";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { StageType } from "../../../../Models/tournaments/stage";
import { Tournament, TournamentStatus, unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import { filter, timedOut } from "../../../functions/messageInteractionFunctions";
import { loginResponse } from "../../../functions/loginResponse";
import { acronymtoMods, modsToAcronym } from "../../../../Interfaces/mods";
import { randomUUID } from "crypto";
import respond from "../../../functions/respond";
import getRound from "../../../functions/tournamentFunctions/getRound";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import confirmCommand from "../../../functions/confirmCommand";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild || !(m.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator))
        return;

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();
    
    const targetSR = m instanceof Message ? parseFloat(m.content.split(" ")[1]) : m.options.getNumber("target_sr");
    if (!targetSR || isNaN(targetSR) || targetSR < 0 || targetSR > 20) {
        await respond(m, "Invalid target SR.");
        return;
    }

    const creator = await getUser(commandUser(m).id, "discord", false);
    if (!creator) {
        await loginResponse(m);
        return;
    }

    const components = await mappoolComponents(m, undefined, undefined, undefined, undefined, { text: m.channelId, searchType: "channel" }, unFinishedTournaments, true);
    if (!components || !components.stage)
        return;

    const { tournament, stage } = components;

    const mappool = new Mappool();
    mappool.createdBy = creator;
    mappool.stage = stage;
    mappool.slots = [];
    mappool.targetSR = targetSR;

    // If the stage is an elmination-type stage, then check if they want to make a mappool for a specific round for the stage; otherwise, just make a mappool for the stage
    if ((stage.stageType === StageType.DoubleElimination || stage.stageType === StageType.SingleElimination) && await confirmCommand(m, `Is this for a specific round in ${stage.abbreviation}?\nIf it's for the entire stage, select No.`)) {
        // Ask if they want to make a mappool for a specific round, or just for the stage
        const round = await getRound(m, stage);
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

    if (existingMappools.length === 13) {
        await respond(m, "This stage/round already has 13 mappools. You cannot create any more.");
        return;
    }

    const cont = existingMappools.length === 0 ? true : await confirmCommand(m, `This stage/round already has ${existingMappools.length} mappool${existingMappools.length === 1 ? "" : "s"}. Are you sure you want to create another?`);
    if (!cont) {
        await respond(m, "Ok Lol .");
        return;
    }

    // Create mappool name and abbreviation using the stage/round name/abbreviation. If a pool already exists for the stage/round, then go down the alphabet and add it to the end of the name/abbreviation
    let baseName = mappool.stage.name;
    let baseAbbreviation = mappool.stage.abbreviation;
    if (mappool.round) {
        baseName = mappool.round.name;
        baseAbbreviation = mappool.round.abbreviation;
    }
    mappool.name = baseName;
    mappool.abbreviation = baseAbbreviation;
    for (let i = 0; i < existingMappools.length; i++) {
        if (existingMappools[i].name === mappool.name) {
            mappool.name = `${baseName}-${String.fromCharCode(65 + i)}`;
            mappool.abbreviation = `${baseAbbreviation}${String.fromCharCode(65 + i)}`;
            i = 0;
        }
    }
    mappool.order = existingMappools.length + 1;

    const message = await respond(m, "Alright let's get started!");
    await mappoolName(message, mappool, tournament, existingMappools);
}

// This function asks for confirmation on the name and abbreviatoin of the mappool, and updates it if the user wants to
async function mappoolName (m: Message, mappool: Mappool, tournament: Tournament, existingMappools: Mappool[]) {
    let content = `The name of the mappool will be **${mappool.name}** and the abbreviation will be **${mappool.abbreviation}**.\n\nIs this ok? If not, type the new name and abbreviation, with the name first, and the abbreviation after.`;
    const ids = {
        stop: randomUUID(),
        confirm: randomUUID(),
    };
    const nameMessage = await m.channel!.send({
        content,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(ids.stop)
                        .setLabel("STOP COMMAND")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(ids.confirm)
                        .setLabel("Looks good")
                        .setStyle(ButtonStyle.Success)
                ),
        ],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    const mappoolNameCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });

    componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
        if (i.customId === ids.stop) {
            await i.reply("Mappool creation stopped.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            mappoolNameCollector.stop();
            return;	
        }
        if (i.customId === ids.confirm) {
            await i.reply("ok Cool.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            mappoolNameCollector.stop();
            await mappoolSlots(m, mappool, tournament);
            return;
        }
    });

    mappoolNameCollector.on("collect", async (msg: Message) => {
        const split = msg.content.split(" ");
        if (split.length < 2) {
            const reply = await msg.reply("You need to provide both a name and an abbreviation.");
            setTimeout(async () => (await reply.delete()), 5000);
            return;
        }
        const abbreviation = split[split.length-1];
        const name = split.slice(0, split.length-1).join(" ");
        if (name.length > 50 || name.length < 3) {
            const reply = await msg.reply("The name must be between 3 and 50 characters.");
            setTimeout(async () => (await reply.delete()), 5000);
            return;
        }
        if (abbreviation.length > 8 || abbreviation.length < 1) {
            const reply = await msg.reply("The abbreviation must be between 1 and 8 characters.");
            setTimeout(async () => (await reply.delete()), 5000);
            return;
        }

        for (const existingPool of existingMappools) {
            if (existingPool.name === name) {
                const reply = await msg.reply("A mappool with that name already exists.");
                setTimeout(async () => (await reply.delete()), 5000);
                return;
            }
            if (existingPool.abbreviation === abbreviation) {
                const reply = await msg.reply("A mappool with that abbreviation already exists.");
                setTimeout(async () => (await reply.delete()), 5000);
                return;
            }
        }

        mappool.name = name;
        mappool.abbreviation = abbreviation;
        const reply = await msg.reply(`The name **${mappool.name}** and the abbreviation **${mappool.abbreviation}** are now saved.`);
        setTimeout(async () => (await reply.delete()), 5000);
        stopped = true;
        componentCollector.stop();
        mappoolNameCollector.stop();
        await mappoolSlots(m, mappool, tournament);
        return;
    });
    mappoolNameCollector.on("end", () => timedOut(nameMessage, stopped, "Mappool creation"));
}

// This function asks the user for slots (slotname, slottype, and # of maps) for the mappool
async function mappoolSlots (m: Message, mappool: Mappool, tournament: Tournament) {
    let content = "Provide the acronym for the slot, followed by the name, and the number of maps that will be in the slot.\nFor any mod restrictions, ALSO provide a list of 2 letter acronyms of all allowed mods followed by 2 numbers, one for the number of users that require mods, one for the number of unique mods required.\nYou can choose to provide 2 numbers only and just the mod combination to allow all non-DT/HT mods for a slot.\nYou can choose to provide mods only if all users will require selecting a mod from the selection of mods.\n\n**Examples:**\nNM Nomod 6 NM: A typical nomod slot with 6 maps in it that will enforce nomod.\nDT Double Time 4 DT: A typical double time slot with 3 maps in it that will enforce double time.\nFM Freemod 3 2 2: A typical freemod slot that will enforce at least 2 unique mods per team, and at least 2 players having mods per team\nFM Freemod 3 HDHRFL 2 2: A typical freemod slot that will enforce at least 2 unique mods per team within the mods HD, HR, or FL, and at least 2 players having mods per team\nTB Tiebreaker 1 0 0 OR TB Tiebreaker 1: A typical tiebreaker slot that will allow all mods, but will not enforce any mods.\n\nYou can also separate each slot with a semicolon, like so:\nNM Nomod 6 NM; DT Double Time 4 DT; FM Freemod 3 2 2; TB Tiebreaker 1\n\nYou have a limit of 10 maps per slot, and 10 slots.\n";
    const ids = {
        stop: randomUUID(),
        done: randomUUID(),
    };
    const slotMessage = await m.channel!.send({
        content,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(ids.stop)
                        .setLabel("STOP COMMAND")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(ids.done)
                        .setLabel("Done adding slots")
                        .setStyle(ButtonStyle.Success)
                ),
        ],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    const slotNameCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });
    
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
        if (i.customId === ids.stop) {
            await i.reply("Mappool creation stopped.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            slotNameCollector.stop();
            return;	
        }
        if (i.customId === ids.done) {
            if (mappool.slots.length === 0) {
                await i.reply("You don't have any slots in the pool bro.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            await i.reply("Mappool slots are created.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            slotNameCollector.stop();
            await mappoolDone(m, mappool);
            return;
        }
    });

    slotNameCollector.on("collect", async (msg: Message) => {
        let slots = msg.content.split(";");
        const mappoolSlotsMade: MappoolSlot[] = [];

        let newSlots = "";
        for (let i = 0; i < slots.length; i++) {
            if (stopped) return;
            let slotInfo = slots[i].trim().split(" ");
            if (slotInfo.length < 3) {  
                const reply = await msg.reply(`Please at least provide the slot name, followed by the slot type, and lastly the number of maps that will be in the slot for slot #${i + 1} \`${slotInfo}\`.`);
                setTimeout(async () => {
                    await reply.delete();
                    await msg.delete();
                }, 5000);
                return;
            }
            const acronym = slotInfo[0];
            if (acronym.length > 3) {
                const reply = await msg.reply(`Please provide a valid acronym for slot #${i + 1} \`${slotInfo}\`.`);
                setTimeout(async () => {
                    await reply.delete();
                    await msg.delete();
                }, 5000);
                return;
            }

            let modNum: number | undefined = undefined;
            let userModCount: number | undefined = undefined;
            let uniqueModCount: number | undefined = undefined;
            if (slotInfo.length > 3) {
                for (let j = slotInfo.length - 1; j >= 3; j--) {
                    const num = parseInt(slotInfo[j]);
                    if (modNum === undefined && slotInfo[j].length % 2 === 0 && isNaN(num)) {
                        const modTest = acronymtoMods(slotInfo[j]);
                        if (modTest === undefined) {
                            const reply = await msg.reply(`**${slotInfo[j]}** is an invalid mod. Please provide a valid mod for slot #${i + 1} \`${slotInfo}\`.`);
                            setTimeout(async () => {
                                await reply.delete();
                                await msg.delete();
                            }, 5000);
                            return;
                        }
                        modNum = modTest;
                        slotInfo.splice(j, 1);
                        break;
                    } else if (!isNaN(num) && num <= tournament.matchSize && num >= 0 && (userModCount === undefined || uniqueModCount === undefined)) {
                        slotInfo.splice(j, 1);

                        if (userModCount === undefined) userModCount = num;
                        else if (uniqueModCount === undefined) uniqueModCount = num;
                        else {
                            const reply = await msg.reply(`Please provide a valid mod combination for slot #${i + 1} \`${slotInfo}\`.`);
                            setTimeout(async () => {
                                await reply.delete();
                                await msg.delete();
                            }, 5000);
                            return;
                        }
                    }
                }
            }

            const mapCount = parseInt(slotInfo[slotInfo.length - 1]);
            const slotName = slotInfo.slice(1, slotInfo.length - 1);

            if (isNaN(mapCount) || mapCount <= 0 || mapCount > 10) {
                const reply = await msg.reply(`Please provide a valid number of maps that will be in the slot for slot #${i + 1} \`${slotInfo}\`.`);
                setTimeout(async () => {
                    await reply.delete();
                    await msg.delete();
                }, 5000);
                return;
            }

            if (slotName.length > 15) {
                const reply = await msg.reply(`Please provide a valid slot name for slot #${i + 1} \`${slotInfo}\`.`);
                setTimeout(async () => {
                    await reply.delete();
                    await msg.delete();
                }, 5000);
                return;
            }

            const slot = new MappoolSlot();
            slot.createdBy = mappool.createdBy;
            slot.acronym = acronym;
            slot.name = slotName.join(" ");
            slot.maps = [];
            for (let i = 0; i < mapCount; i++) {
                const map = new MappoolMap();
                map.createdBy = mappool.createdBy;
                map.order = i + 1;
                slot.maps.push(map);
            }
            slot.allowedMods = modNum;
            if (userModCount !== 0) slot.userModCount = userModCount;
            if (uniqueModCount !== 0) slot.uniqueModCount = uniqueModCount;

            mappoolSlotsMade.push(slot)
            newSlots += `\n${acronym} ${slotName.join(" ")} ${mapCount} maps ${modNum !== undefined ? `with ${modsToAcronym(modNum)} mods` : ""}${userModCount ? ` with ${userModCount} mod${userModCount > 1 ? "s" : ""} per user` : ""}${uniqueModCount ? ` with ${uniqueModCount} unique mod${uniqueModCount > 1 ? "s" : ""}` : ""}`;
        }

        // Check for duplicate slot names/abbreviations
        const slotNames = [mappool.slots.map(s => s.name.toLowerCase()), mappoolSlotsMade.map(s => s.name.toLowerCase())].flat();
        const slotAcronyms = [mappool.slots.map(s => s.acronym.toLowerCase()), mappoolSlotsMade.map(s => s.acronym.toLowerCase())].flat();
        const duplicateSlotNames = slotNames.filter((s, i) => slotNames.indexOf(s) !== i);
        const duplicateSlotAcronyms = slotAcronyms.filter((s, i) => slotAcronyms.indexOf(s) !== i);
        if (duplicateSlotNames.length > 0 || duplicateSlotAcronyms.length > 0) {
            const reply = await msg.reply(`Please provide unique slot names and abbreviations.\nDuplicate slot names: \`${duplicateSlotNames.join(", ")}\`.\nDuplicate slot abbreviations: \`${duplicateSlotAcronyms.join(", ")}\`.`);
            setTimeout(async () => {
                await reply.delete();
                await msg.delete();
            }, 5000);
            return;
        }

        // Check for 10 slot limit
        if (mappool.slots.length + mappoolSlotsMade.length > 10) {
            const reply = await msg.reply(`You can only have 10 slots in a mappool. You would have ${mappool.slots.length + mappoolSlotsMade.length} slots if you added these slots.`);
            setTimeout(async () => {
                await reply.delete();
                await msg.delete();
            }, 5000);
            return;
        }

        mappool.slots.push(...mappoolSlotsMade);

        const reply = await msg.reply(`Mappool slots created: ${newSlots}`);
        setTimeout(async () => {
            await reply.delete();
            await msg.delete();
        }, 5000);

        content += newSlots;
        await slotMessage.edit(content);
    });
    slotNameCollector.on("end", () => timedOut(slotMessage, stopped, "Mappool creation"));
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
        .setTitle(`${mappool.name} (${mappool.abbreviation.toUpperCase()})`)
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
    .setName("mappool_create")
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
    alternativeNames: ["create_mappool", "create-mappool", "mappool-create", "mappoolcreate", "createmappool", "mappoolc", "cmappool", "pool_create", "create_pool", "pool-create", "create-pool", "poolcreate", "createpool", "createp", "pcreate", "poolc", "cpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};
    
export default mappoolCreate;