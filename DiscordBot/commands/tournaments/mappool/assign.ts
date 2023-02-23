import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, GuildMemberRoleManager, Message, MessageComponentInteraction, SlashCommandBuilder } from "discord.js";
import { getPoolData, updatePoolRow } from "../../../../Server/sheets";
import { Command } from "../../index";
import { Tournament, TournamentStatus } from "../../../../Models/tournaments/tournament";
import { fetchTournament } from "../../../functions/fetchTournament";
import { TournamentRole, TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { Brackets } from "typeorm";
import { filter } from "../../../functions/messageInteractionFunctions";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { Beatmap } from "../../../../Models/beatmap";
import { Beatmap as APIBeatmap } from "nodesu";
import { osuClient } from "../../../../Server/osu";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, false, false)))
        return;

    const waiting = await m.channel.send("Assigning...");
    try {
        const { pool, user, slot, round } = await mappoolFunctions.parseParams(m);

        // check if slot and round were given
        if (slot === "") {
            m.channel.send("Missing slot");
            return;
        }
        if (round === "") {
            m.channel.send("Missing round");
            return;
        }

        // Get pool data and iterate thru
        const rows = await getPoolData(pool, round.toUpperCase());
        if (!rows) {
            m.channel.send(`Could not find round **${round.toUpperCase()}** in the **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** pool`);
            return;
        }
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (slot.toLowerCase() === row[0].toLowerCase()) {
                await Promise.all([
                    updatePoolRow(pool, `'${round}'!B${i + 2}`, [ user.nickname ?? user.user.username ]),
                    updatePoolRow(pool, `'${round}'!P${i + 2}`, [ user.id ]),
                ]);
                m.channel.send(`Assigned ${user.nickname ?? user.user.username} to the slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
                return;
            }
        }
        m.channel.send(`Could not assign ${user.nickname ?? user.user.username} to the slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
    } finally {
        waiting.delete();
    }
}

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild) {
        return;
    }

    const tournaments = await Tournament.find({
        where: {
            server: m.guild.id,
        },
    });
    const currentTournaments = tournaments.filter(t => t.status !== TournamentStatus.Finished);
    if (currentTournaments.length === 0) {
        m.reply("There is no tournament running on this server");
        return;
    }

    const message = await m.channel!.send("Assigning...");

    const tournament = await fetchTournament(message, currentTournaments);
    if (!tournament)
        return;

    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const allowedRoles = roles.filter(r => r.roleType === TournamentRoleType.Organizer || r.roleType === TournamentRoleType.Mappoolers);
    if (allowedRoles.length === 0) {
        m.reply("There are no roles for this tournament. Please add organizer/mappooler (and mapper if custom mapping) roles first.");
        return;
    }

    // Check if user is a mappooler or organizer
    const allowed = (m.member!.roles as GuildMemberRoleManager).cache.hasAny(...allowedRoles.map(r => r.roleID));
    if (!allowed) {
        m.reply("You are not a mappooler or organizer for this tournament.");
        return;
    }

    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const targetRegex = /-t (\S+)/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[2] : m.options.getString("slot");
    const targetText = m instanceof Message ? m.content.match(targetRegex) ?? m.content.split(" ")[3] : m.options.getSubcommand() === "custom" ? m.options.getUser("user")?.id : m.options.getString("link");
    if (!poolText || !slotText || !targetText) {
        m.reply("Missing parameters. Please use `-p <pool> -s <slot> -t <target>` or `<pool> <slot> <target>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[0];
    const order = typeof slotText === "string" ? parseInt(slotText.substring(slotText.length - 1)) : parseInt(slotText[0].substring(slotText[0].length - 1));
    const slot = typeof slotText === "string" ? parseInt(slotText.substring(0, slotText.length - 1)) : parseInt(slotText[0].substring(0, slotText[0].length - 1));
    const target = typeof targetText === "string" ? targetText : targetText[0];
    if (!poolText || !slotText || !targetText || !order) {
        m.reply("Missing parameters. Please use `-p <pool> -s <slot> -t <target>` or `<pool> <slot> <target>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }
    if (isNaN(order)) {
        m.reply("Invalid slot number. Please use a valid slot number.");
        return;
    }

    const mappools = await Mappool
        .createQueryBuilder("mappool")
        .leftJoinAndSelect("mappool.stage", "stage")
        .leftJoinAndSelect("mappool.round", "round")
        .where("stage.tournament = :tournament")
        .andWhere(new Brackets(qb => {
            qb.where("stage.name LIKE :criteria")
                .orWhere("round.name LIKE :criteria")
                .orWhere("stage.abbreviation LIKE :criteria")
                .orWhere("round.abbreviation LIKE :criteria");
        }))
        .setParameters({
            tournament: tournament.ID,
            criteria: `%${pool}%`,
        })
        .getMany();

    if (mappools.length === 0) {
        m.reply(`Could not find mappool **${pool}**`);
        return;
    }

    const mappool = await multipleMappools(m, mappools);
    if (!mappool)
        return;

    const slotMods = await MappoolSlot
        .createQueryBuilder("slot")
        .leftJoinAndSelect("slot.mappool", "mappool")
        .leftJoinAndSelect("slot.maps", "maps")
        .where("mappool.ID = :mappool")
        .andWhere(new Brackets(qb => {
            qb.where("slot.name LIKE :criteria")
                .orWhere("slot.abbreviation LIKE :criteria");
        }))
        .setParameters({
            mappool: mappool.ID,
            criteria: `%${slot}%`,
        })
        .getMany();

    if (slotMods.length === 0) {
        m.reply(`Could not find slot **${slot}**`);
        return;
    }

    const slotMod = await multipleSlots(m, slotMods);
    if (!slotMod)
        return;

    const mappoolMap = slotMod.maps.find(m => m.order === order);
    if (!mappoolMap) {
        m.reply(`Could not find map **${order}**`);
        return;
    }

    // Check if target is link
    const linkRegex = /https:\/\/osu.ppy.sh\/beatmapsets\/(\d+)#(osu|taiko|fruits|mania)\/(\d+)/;
    const link = target.match(linkRegex);
    if (link) {
        const beatmapID = parseInt(link[3]);
        let beatmap = await Beatmap.findOne({
            where: {
                ID: beatmapID,
            },
        });
        if (!beatmap) {
            const apiMap = (await osuClient.beatmaps.getByBeatmapId(beatmapID) as APIBeatmap[]);
            if (apiMap.length === 0) {
                m.reply("Could not find beatmap on osu!api.");
                return;
            }
            beatmap = await Beatmap.fromAPI(apiMap[0]);
            

}

// Function to choose a mappool from a list of mappools
async function multipleMappools (m: Message | ChatInputCommandInteraction, existingMappools: Mappool[]): Promise<Mappool | undefined> {
    if (existingMappools.length === 1)
        return existingMappools[0];

    const buttons = existingMappools.map((mappool, i) => {
        return new ButtonBuilder()
            .setCustomId(i.toString())
            .setLabel(`${mappool.round ? mappool.round.abbreviation : mappool.stage!.abbreviation}${mappool.order ? `-${mappool.order}` : ""}`)
            .setStyle(ButtonStyle.Primary);
    });

    const message = await m.channel!.send({
        content: `There are multiple mappools that matched your query. Please choose the appropriate one:`,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    ...buttons,
                    new ButtonBuilder()
                        .setCustomId("none")
                        .setLabel("None of these. Failed query.")
                        .setStyle(ButtonStyle.Danger)),
        ],
    });

    return new Promise<Mappool | undefined>(resolve => {
        const confirmationCollector = m.channel!.createMessageComponentCollector({ filter, time: 60000 });
        confirmationCollector.on("collect", async (msg: Message | MessageComponentInteraction) => {
            if (msg instanceof MessageComponentInteraction) {
                if (msg.customId === "none") {
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(undefined);
                } else {
                    const mappool = existingMappools[parseInt(msg.customId)];
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(mappool);
                }
            }
        });
    });
}

// Function to choose a slot from a list of slots
async function multipleSlots (m: Message | ChatInputCommandInteraction, existingSlots: MappoolSlot[]): Promise<MappoolSlot | undefined> {
    if (existingSlots.length === 1)
        return existingSlots[0];

    const buttons = existingSlots.map((slot, i) => {
        return new ButtonBuilder()
            .setCustomId(i.toString())
            .setLabel(`${slot.name} (${slot.acronym})`)
            .setStyle(ButtonStyle.Primary);
    });

    const message = await m.channel!.send({
        content: `There are multiple slots that matched your query. Please choose the appropriate one:`,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    ...buttons,
                    new ButtonBuilder()
                        .setCustomId("none")
                        .setLabel("None of these. Failed query.")
                        .setStyle(ButtonStyle.Danger)),
        ],
    });

    return new Promise<MappoolSlot | undefined>(resolve => {
        const confirmationCollector = m.channel!.createMessageComponentCollector({ filter, time: 60000 });  
        confirmationCollector.on("collect", async (msg: Message | MessageComponentInteraction) => {
            if (msg instanceof MessageComponentInteraction) {
                if (msg.customId === "none") {
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(undefined);
                } else {
                    const slot = existingSlots[parseInt(msg.customId)];
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(slot);
                }
            }
        });
    });
}

const data = new SlashCommandBuilder()
    .setName("mappool_assign")
    .setDescription("Assign a beatmap or mapper to a mappool slot.")
    .addSubcommand(subcommand =>
        subcommand.setName("custom")
            .setDescription("Assign a custom beatmap to a mappool slot.")
            .addStringOption(option =>
                option.setName("pool")
                    .setDescription("The mappool to assign to.")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("slot")
                    .setDescription("The slot to assign to.")
                    .setRequired(true))
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("The user to assign.")
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand.setName("beatmap")
            .setDescription("Assign an already existing beatmap to a mappool slot.")
            .addStringOption(option =>
                option.setName("pool")
                    .setDescription("The mappool to assign to.")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("slot")
                    .setDescription("The slot to assign to.")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("link")
                    .setDescription("The beatmap link to assign.")
                    .setRequired(true)))
    .setDMPermission(false);

const mappoolAssign: Command = {
    data,
    alternativeNames: ["assign_mappool", "mappool-assign", "assign-mappool", "mappoolassign", "assignmappool", "assignp", "passign", "mappoola", "amappool", "pool_assign", "assign_pool", "pool-assign", "assign-pool", "poolassign", "assignpool", "poola", "apool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolAssign;