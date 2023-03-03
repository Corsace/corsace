import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, Message, MessageComponentInteraction, PermissionFlagsBits, PermissionsBitField, User as DiscordUser } from "discord.js";
import { Mappool } from "../../Models/tournaments/mappools/mappool";
import { MappoolSlot } from "../../Models/tournaments/mappools/mappoolSlot";
import { Round } from "../../Models/tournaments/round";
import { Stage } from "../../Models/tournaments/stage";
import { Tournament, TournamentStatus } from "../../Models/tournaments/tournament";
import { TournamentChannel, TournamentChannelType } from "../../Models/tournaments/tournamentChannel";
import { TournamentRole, TournamentRoleType } from "../../Models/tournaments/tournamentRole";
import { User } from "../../Models/user";
import { discordClient } from "../../Server/discord";
import { filter, stopRow } from "./messageInteractionFunctions";

// Function to fetch a staff member for a tournament
export async function fetchStaff (m: Message | ChatInputCommandInteraction, tournament: Tournament, target: string, targetRoles: TournamentRoleType[]): Promise<User | undefined> {
    let discordUser: DiscordUser | GuildMember;
    if (m instanceof ChatInputCommandInteraction)
        discordUser = m.options.getUser("user")!;
    else if (m.mentions.members && m.mentions.members.first())
        discordUser = m.mentions.members.first()!;
    else {
        const members = await m.guild!.members.fetch({ query: target });
        const member = members.first();
        if (!member) {
            m.reply(`Could not find user \`${target}\` server. Please try again, or contact a Corsace admin if the problem persists.`);
            return;
        }
        discordUser = member;
    }

    const user = await User.findOne({
        where: {
            discord: {
                userID: discordUser.id,
            }
        },
    });
    if (!user) {
        m.reply("Could not find discord user in database. Please ensure that they have logged into Corsace .");
        return;
    }

    const tournamentServer = discordClient.guilds.cache.get(tournament.server);
    if (!tournamentServer) {
        m.reply("Could not find tournament server. Please try again, or contact a Corsace admin if the problem persists.");
        return;
    }

    const discordMember = await tournamentServer.members.fetch(discordUser);
    if (!discordMember) {
        m.reply("Could not find user in tournament server. Please try again, or contact a Corasce admin if the problem persists.");
        return;
    }

    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const mapperRoles = roles.filter(role => targetRoles.some(t => t === role.roleType));
    if (mapperRoles.length === 0) {
        m.reply(`Could not find any ${targetRoles.map(t => t.toString()).join("/")} roles. Please contact a Corsace admin.`);
        return;
    }

    if (!mapperRoles.some(role => discordMember.roles.cache.has(role.roleID))) {
        m.reply(`User does not have any ${targetRoles.map(t => t.toString()).join("/")} roles.`);
        return;
    }

    return user;
}

// Function to fetch the tournament to create a stage for
export async function fetchTournament (m: Message | ChatInputCommandInteraction, tournamentStatusFilters: TournamentStatus[], adminPerms?: boolean, stages?: boolean, rounds?: boolean): Promise<Tournament | undefined> {
    if (!m.guild)
        return undefined;

    if (adminPerms && !(m.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator))
        return undefined;

    let relations: string[] | undefined = [];
    if (stages)
        relations.push("stages");
    if (rounds)
        relations.push("stages.rounds"); 
    if (relations.length > 0)
        relations = undefined;

    // Check for tournaments in
    const tournamentList = await Tournament.find({
        where: {
            server: m.guild.id,
        },
        relations,
    });
    const filteredTournaments = tournamentStatusFilters.length === 0 ? tournamentList : tournamentList.filter(t => tournamentStatusFilters.some(f => f === t.status));
    if (filteredTournaments.length === 0) {
        m.reply("There is no tournament running on this server");
        return undefined;
    }

    if (filteredTournaments.length === 1)
        return filteredTournaments[0];

    let row = new ActionRowBuilder<ButtonBuilder>();
    for (const tournament of filteredTournaments)
        row = row.addComponents(
            new ButtonBuilder()
                .setCustomId(tournament.ID.toString())
                .setLabel(tournament.name)
                .setStyle(ButtonStyle.Primary)
        );

    const message = await m.channel!.send({
        content: "Which tournament are we working on?",
        components: [row, stopRow],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    
    return new Promise((resolve) => {
        componentCollector.on("collect", async (i: MessageComponentInteraction) => {
            if (i.customId === "stop") {
                stopped = true;
                componentCollector.stop();
                await i.reply("Tournament creation stopped.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            const tournament = filteredTournaments.find(t => t.ID.toString() === i.customId);
            if (!tournament) {
                await i.reply("That tournament doesn't exist.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }

            stopped = true;
            componentCollector.stop();
            resolve(tournament);
        });
        componentCollector.on("end", async () => {
            await message.delete();
            if (!stopped) {
                await m.reply("Tournament creation timed out.");
                resolve(undefined);
            }
        });
    });
}

// Function to fetch the stage to create a mappool for
export async function fetchStage (m: Message | ChatInputCommandInteraction, tournament: Tournament): Promise<Stage | undefined> {
    if (tournament.stages.length === 1)
        return tournament.stages[0];

    let row = new ActionRowBuilder<ButtonBuilder>();
    for (const stage of tournament.stages) {
        row = row.addComponents(
            new ButtonBuilder()
                .setCustomId(stage.ID.toString())
                .setLabel(stage.name)
                .setStyle(ButtonStyle.Primary)
        );
    }

    const message = await m.channel!.send({
        content: "Which stage are we working on?",
        components: [row, stopRow],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    
    return new Promise((resolve) => {
        componentCollector.on("collect", async (i: MessageComponentInteraction) => {
            if (i.customId === "stop") {
                stopped = true;
                componentCollector.stop();
                await i.reply("Tournament creation stopped.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            const stage = tournament.stages.find(s => s.ID.toString() === i.customId);
            if (!stage) {
                await i.reply("That stage doesn't exist.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }

            stopped = true;
            componentCollector.stop();
            resolve(stage);
        });
        componentCollector.on("end", async () => {
            await message.delete();
            if (!stopped) {
                await m.reply("Tournament creation timed out.");
                resolve(undefined);
            }
        });
    });
}

// Function to fetch the round to create a mappool/match/e.t.c. for (undefined if this is for a stage instead)
export async function fetchRound (m: Message | ChatInputCommandInteraction, stage: Stage): Promise<Round | undefined> {
    if (stage.rounds.length === 0)
        return undefined;

    let row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("none")
                .setLabel("None. This is for the stage.")
                .setStyle(ButtonStyle.Primary)
        );
    for (const round of stage.rounds) {
        row = row.addComponents(
            new ButtonBuilder()
                .setCustomId(round.ID.toString())
                .setLabel(round.name)
                .setStyle(ButtonStyle.Secondary)
        );
    }

    const message = await m.channel!.send({
        content: "Which round are we working on?",
        components: [row, stopRow],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    
    return new Promise((resolve) => {
        componentCollector.on("collect", async (i: MessageComponentInteraction) => {
            if (i.customId === "stop") {
                stopped = true;
                componentCollector.stop();
                await i.reply("Tournament creation stopped.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            const round = stage.rounds.find(r => r.ID.toString() === i.customId);
            if (!round && i.customId !== "none") {
                await i.reply("That round doesn't exist.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }

            stopped = true;
            componentCollector.stop();
            if (i.customId === "none")
                resolve(undefined);
            else
                resolve(round);
        });
        componentCollector.on("end", async () => {
            await message.delete();
            if (!stopped)
                await m.reply("Tournament creation timed out.");
            
            resolve(undefined);
        });
    });
}

export async function fetchMappool (m: Message | ChatInputCommandInteraction, tournament: Tournament, poolText: string = "", getRelations: boolean = false): Promise<Mappool | undefined> {
    const mappools = await Mappool.search(tournament, poolText, getRelations)
    if (mappools.length === 0) {
        m.reply(`Could not find mappool **${poolText}**`);
        return;
    }

    if (mappools.length === 1)
        return mappools[0];

    const buttons = mappools.map((mappool, i) => {
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
                    const mappool = mappools[parseInt(msg.customId)];
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(mappool);
                }
            }
        });
    });
}

export async function fetchSlot (m: Message | ChatInputCommandInteraction, mappool: Mappool, poolText: string = "", getRelations: boolean = false) {
    const slots = await MappoolSlot.search(mappool, poolText, getRelations);
    if (slots.length === 0) {
        m.reply(`Could not find mappool **${poolText}**`);
        return;
    }
    
    if (slots.length === 1)
        return slots[0];

    const buttons = slots.map((slot, i) => {
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
                    const slot = slots[parseInt(msg.customId)];
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(slot);
                }
            }
        });
    });
}

export async function hasTournamentRoles (m: Message | ChatInputCommandInteraction, tournament: Tournament, targetRoles: TournamentRoleType[]): Promise<boolean> {
    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const allowedRoles = roles.filter(r => targetRoles.some(t => t === r.roleType));
    if (allowedRoles.length === 0) {
        m.reply(`There are no roles for this tournament. Please add ${targetRoles.map(t => t.toString()).join(", ")} roles first.`);
        return false;
    }

    // Check if user is a mappooler or organizer
    const allowed = (m.member!.roles as GuildMemberRoleManager).cache.hasAny(...allowedRoles.map(r => r.roleID));
    if (!allowed) {
        m.reply("You are not a mappooler or organizer for this tournament.");
        return false;
    }

    return true;
}

export async function isSecuredChannel (m: Message | ChatInputCommandInteraction, tournament: Tournament, targetChannels: TournamentChannelType[]): Promise<boolean> {
    const channels = await TournamentChannel.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const allowedChannels = channels.filter(c => targetChannels.some(t => t === c.channelType));
    if (allowedChannels.length === 0) {
        m.reply(`There are no applicable secured channels for this tournament that will run this command. Please add ${targetChannels.map(t => t.toString()).join(", ")} channels first.`);
        return false;
    }

    // Check if user is in a secured channel
    const allowed = allowedChannels.some(c => c.channelID === m.channel!.id || (m.channel && m.channel.isThread() && c.channelID === m.channel.parentId) );
    if (!allowed) {
        m.reply("You are not in a secured channel for this tournament.");
        return false;
    }

    return true;
}