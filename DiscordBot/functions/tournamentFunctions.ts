import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, Message, MessageComponentInteraction, PermissionFlagsBits, PermissionsBitField, User as DiscordUser, EmbedBuilder, TextChannel, ThreadChannel, ForumChannel, ChannelType, GuildForumThreadCreateOptions } from "discord.js";
import { Mappool } from "../../Models/tournaments/mappools/mappool";
import { MappoolSlot } from "../../Models/tournaments/mappools/mappoolSlot";
import { Round } from "../../Models/tournaments/round";
import { Stage } from "../../Models/tournaments/stage";
import { Tournament, TournamentStatus } from "../../Models/tournaments/tournament";
import { TournamentChannel, TournamentChannelType } from "../../Models/tournaments/tournamentChannel";
import { TournamentRole, TournamentRoleType } from "../../Models/tournaments/tournamentRole";
import { User } from "../../Models/user";
import { discordClient } from "../../Server/discord";
import { stopRow } from "./messageInteractionFunctions";
import { MappoolMapHistory } from "../../Models/tournaments/mappools/mappoolMapHistory";
import modeColour from "./modeColour";
import { MappoolMap } from "../../Models/tournaments/mappools/mappoolMap";
import { randomUUID } from "crypto";

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
            m.reply(`Could not find user \`${target}\` in the server. Please try again, or contact a Corsace admin if the problem persists.`);
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
        if (m instanceof Message) m.reply(`Could not find discord user ${discordUser.toString()} in database. Please ensure that they have logged into Corsace.`);
        else m.editReply(`Could not find discord user ${discordUser.toString()} in database. Please ensure that they have logged into Corsace.`);
        return;
    }

    const tournamentServer = discordClient.guilds.cache.get(tournament.server);
    if (!tournamentServer) {
        if (m instanceof Message) m.reply("Could not find the tournament's discord server. Please try again, or contact a Corsace admin if the problem persists.");
        else m.editReply("Could not find the tournament's discord server. Please try again, or contact a Corsace admin if the problem persists.");
        return;
    }

    const discordMember = await tournamentServer.members.fetch(discordUser);
    if (!discordMember) {
        if (m instanceof Message) m.reply(`Could not find user ${discordUser.toString()} in tournament server. Please try again, or contact a Corasce admin if the problem persists.`);
        else m.editReply(`Could not find user ${discordUser.toString()} in tournament server. Please try again, or contact a Corasce admin if the problem persists.`);
        return;
    }

    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const roleFilter = roles.filter(role => targetRoles.some(t => t === role.roleType));
    if (roleFilter.length === 0) {
        if (m instanceof Message) m.reply(`Could not find any ${targetRoles.map(t => t.toString()).join("/")} roles. Please contact a Corsace admin.`);
        else m.editReply(`Could not find any ${targetRoles.map(t => t.toString()).join("/")} roles. Please contact a Corsace admin.`);
        return;
    }

    if (!roleFilter.some(role => discordMember.roles.cache.has(role.roleID))) {
        if (m instanceof Message) m.reply(`User does not have any ${targetRoles.map(t => t.toString()).join("/")} roles.`);
        else m.editReply(`User does not have any ${targetRoles.map(t => t.toString()).join("/")} roles.`);
        return;
    }

    return user;
}

// Function to fetch the tournament to create a stage for
export async function fetchTournament (m: Message | ChatInputCommandInteraction, tournamentStatusFilters?: TournamentStatus[], adminPerms?: boolean, stages?: boolean, rounds?: boolean, checkChannel?: boolean): Promise<Tournament | undefined> {
    if (!m.guild)
        return;

    if (adminPerms && !(m.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator))
        return;

    const tournamentQ = Tournament.createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.mode", "mode");
    if (stages)
        tournamentQ.leftJoinAndSelect("tournament.stages", "stage");
    if (rounds)
        tournamentQ.leftJoinAndSelect("stage.rounds", "round");

    tournamentQ
        .leftJoin("tournament.channels", "channel")
        .where("tournament.server = :server", { server: m.guild.id });
    if (checkChannel)
        tournamentQ
            .andWhere("channel.channelID = :channelID", { channelID: m.channel!.id })

    if (tournamentStatusFilters)
        tournamentQ.andWhere("tournament.status IN (:...status)", { status: tournamentStatusFilters });
    
    // Check for tournaments in the server
    const tournamentList = await tournamentQ.getMany();
    if (tournamentList.length === 0) {
        if (checkChannel) {
            if (m instanceof Message) m.reply("This channel is not linked to any of the server's tournaments.");
            else m.editReply("This channel is not linked to any of the server's tournaments.");
        } else {
            if (m instanceof Message) m.reply("There are no tournaments in this server.");
            else m.editReply("There are no tournaments in this server.");
        }
        return;
    }

    if (tournamentList.length === 1)
        return tournamentList[0];

    let row = new ActionRowBuilder<ButtonBuilder>();
    const [stopID, stop] = stopRow();
    const ids: any = {
        stop: stopID,
    }
    for (const tournament of tournamentList) {
        ids[tournament.ID.toString()] = randomUUID();
        row = row.addComponents(
            new ButtonBuilder()
                .setCustomId(ids[tournament.ID.toString()])
                .setLabel(tournament.name)
                .setStyle(ButtonStyle.Primary)
        );
    }

    const message = await m.channel!.send({
        content: "Which tournament are we working on?",
        components: [row, stop],
    });

    let stopped = false;
    const filter = (i: MessageComponentInteraction) => i.user.id === (m instanceof Message ? m.author.id : m.user.id);
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    
    return new Promise((resolve) => {
        componentCollector.on("collect", async (i: MessageComponentInteraction) => {
            if (i.customId === ids.stop) {
                stopped = true;
                componentCollector.stop();
                await i.reply("Tournament creation stopped.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            const tournament = tournamentList.find(t => ids[t.ID.toString()] === i.customId);
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
                if (m instanceof Message) await m.reply("Tournament creation timed out.");
                else await m.editReply("Tournament creation timed out.");
                resolve(undefined);
            }
        });
    });
}

// Function to fetch the stage to create a mappool for
export async function fetchStage (m: Message | ChatInputCommandInteraction, tournament: Tournament): Promise<Stage | undefined> {
    if (tournament.stages.length === 0) {
        if (m instanceof Message) m.reply("This tournament currently has no stages. Please create a stage first.");
        else m.editReply("This tournament currently has no stages. Please create a stage first.");
        return;
    }

    if (tournament.stages.length === 1)
        return tournament.stages[0];

    const [stopID, stop] = stopRow();
    const ids: any = {
        stop: stopID,
    }
    let row = new ActionRowBuilder<ButtonBuilder>();
    for (const stage of tournament.stages) {
        ids[stage.ID.toString()] = randomUUID();
        row = row.addComponents(
            new ButtonBuilder()
                .setCustomId(ids[stage.ID.toString()])
                .setLabel(stage.name)
                .setStyle(ButtonStyle.Primary)
        );
    }

    const message = await m.channel!.send({
        content: "Which stage are we working on?",
        components: [row, stop],
    });

    let stopped = false;
    const filter = (i: MessageComponentInteraction) => i.user.id === (m instanceof Message ? m.author.id : m.user.id);
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    
    return new Promise((resolve) => {
        componentCollector.on("collect", async (i: MessageComponentInteraction) => {
            if (i.customId === ids.stop) {
                stopped = true;
                componentCollector.stop();
                await i.reply("Tournament creation stopped.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            const stage = tournament.stages.find(s => ids[s.ID.toString()] === i.customId);
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
                if (m instanceof Message) await m.reply("Tournament creation timed out.");
                else await m.editReply("Tournament creation timed out.");
                resolve(undefined);
            }
        });
    });
}

// Function to fetch the round to create a mappool/match/e.t.c. for (undefined if this is for a stage instead)
export async function fetchRound (m: Message | ChatInputCommandInteraction, stage: Stage): Promise<Round | undefined> {
    if (stage.rounds.length === 0)
        return;

    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    const [stopID, stop] = stopRow();
    const ids: any = {
        stop: stopID,
        none: randomUUID(),
    }
    let row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(ids.none)
                .setLabel("None this is for the stage")
                .setStyle(ButtonStyle.Primary)
        );
    for (const round of stage.rounds) {
        ids[round.ID.toString()] = randomUUID();
        row = row.addComponents(
            new ButtonBuilder()
                .setCustomId(ids[round.ID.toString()])
                .setLabel(round.name)
                .setStyle(ButtonStyle.Secondary)
        );
        if (row.components.length === 5) {
            components.push(row);
            row = new ActionRowBuilder<ButtonBuilder>();
        }
    }
    components.push(row, stop);

    const message = await m.channel!.send({
        content: "Which round are we working on?",
        components,
    });

    let stopped = false;
    const filter = (i: MessageComponentInteraction) => i.user.id === (m instanceof Message ? m.author.id : m.user.id);
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    
    return new Promise((resolve) => {
        componentCollector.on("collect", async (i: MessageComponentInteraction) => {
            if (i.customId === ids.stop) {
                stopped = true;
                componentCollector.stop();
                await i.reply("Tournament creation stopped.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            const round = stage.rounds.find(r => ids[r.ID.toString()] === i.customId);
            if (!round && i.customId !== ids.none) {
                await i.reply("That round doesn't exist.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }

            stopped = true;
            componentCollector.stop();
            if (i.customId === ids.none)
                resolve(undefined);
            else
                resolve(round);
        });
        componentCollector.on("end", async () => {
            await message.delete();
            if (!stopped)
                if (m instanceof Message) await m.reply("Tournament creation timed out.");
                else await m.editReply("Tournament creation timed out.");
            
            resolve(undefined);
        });
    });
}

export async function fetchMappool (m: Message | ChatInputCommandInteraction, tournament: Tournament, poolText: string = "", getStageRound: boolean = false, getSlots: boolean = false, getMaps: boolean = false): Promise<Mappool | undefined> {
    const mappools = await Mappool.search(tournament, poolText, getStageRound, getSlots, getMaps);
    if (mappools.length === 0) {
        if (m instanceof Message) m.reply(`Could not find mappool **${poolText}**`);
        else m.editReply(`Could not find mappool **${poolText}**`);
        return;
    }

    if (mappools.length === 1)
        return mappools[0];

    const ids: any = {
        none: randomUUID(),
    };
    const buttons = mappools.map((mappool, i) => {
        ids[i.toString()] = randomUUID();
        return new ButtonBuilder()
            .setCustomId(ids[i.toString()])
            .setLabel(`${mappool.abbreviation.toUpperCase()}${mappool.order ? `-${mappool.order}` : ""}`)
            .setStyle(ButtonStyle.Primary);
    });

    const message = await m.channel!.send({
        content: `There are multiple mappools that matched your query. Please choose the appropriate one:`,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    ...buttons,
                    new ButtonBuilder()
                        .setCustomId(ids.none)
                        .setLabel("None of these")
                        .setStyle(ButtonStyle.Danger)),
        ],
    });

    return new Promise<Mappool | undefined>(resolve => {
        const filter = (i: MessageComponentInteraction) => i.user.id === (m instanceof Message ? m.author.id : m.user.id);
        const confirmationCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
        confirmationCollector.on("collect", async (msg: Message | MessageComponentInteraction) => {
            if (msg instanceof MessageComponentInteraction) {
                if (msg.customId === ids.none) {
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(undefined);
                } else {
                    const mappool = mappools.find((m, i) => ids[i.toString()] === msg.customId);
                    if (!mappool) {
                        await msg.reply("That mappool doesn't exist.");
                        setTimeout(async () => await msg.deleteReply(), 5000);
                        return;
                    }
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(mappool);
                }
            }
        });
    });
}

export async function fetchSlot (m: Message | ChatInputCommandInteraction, mappool: Mappool, slotText: string = "", getRelations: boolean = false): Promise<MappoolSlot | undefined> {
    let slots = mappool.slots ?? await MappoolSlot.search(mappool, slotText, getRelations);
    if (mappool.slots)
        slots = slots.filter(slot => slot.name.toLowerCase().includes(slotText.toLowerCase()));

    if (slots.length === 0) {
        if (m instanceof Message) m.reply(`Could not find slot **${slotText}**`);
        else m.editReply(`Could not find slot **${slotText}**`);
        return;
    }
    
    if (slots.length === 1)
        return slots[0];

    const ids: any = {
        none: randomUUID(),
    };
    const buttons = slots.map((slot, i) => {
        ids[i.toString()] = randomUUID();
        return new ButtonBuilder()
            .setCustomId(ids[i.toString()])
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
                        .setCustomId(ids.none)
                        .setLabel("None of these")
                        .setStyle(ButtonStyle.Danger)),
        ],
    });

    return new Promise<MappoolSlot | undefined>(resolve => {
        const filter = (i: MessageComponentInteraction) => i.user.id === (m instanceof Message ? m.author.id : m.user.id);
        const confirmationCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });  
        confirmationCollector.on("collect", async (msg: Message | MessageComponentInteraction) => {
            if (msg instanceof MessageComponentInteraction) {
                if (msg.customId === ids.none) {
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(undefined);
                } else {
                    const slot = slots.find((s, i) => ids[i.toString()] === msg.customId);
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(slot);
                }
            }
        });
    });
}

export async function fetchCustomThread (m: Message | ChatInputCommandInteraction, mappoolMap: MappoolMap, tournament: Tournament, slot: string): Promise<[ThreadChannel, Message] | boolean | undefined> {
    const content = `Map: **${mappoolMap.customBeatmap ? `${mappoolMap.customBeatmap.artist} - ${mappoolMap.customBeatmap.title} [${mappoolMap.customBeatmap.difficulty}]` : "N/A"}**\nMapper(s): **${mappoolMap.customMappers.length > 0 ? mappoolMap.customMappers.map(u => `<@${u.discord.userID}>`).join(" ") : "N/A"}**\nTestplayer(s): **${mappoolMap.testplayers.length > 0 ? mappoolMap.testplayers.map(u => `<@${u.discord.userID}>`).join(" ") : "N/A"}**\nDeadline: ${mappoolMap.deadline ? `<t:${mappoolMap.deadline.getTime() / 1000}:F> (<t:${mappoolMap.deadline.getTime() / 1000}:R>)` : "**N/A**"}`;

    if (!mappoolMap.customThreadID) {
        const tourneyChannels = await TournamentChannel.find({
            where: {
                tournament: {
                    ID: tournament.ID,
                }
            }
        });
        const tournamentChannel = tourneyChannels.find(c => c.channelType === TournamentChannelType.Mappoolqa);
        const mappoolChannel = discordClient.channels.cache.get(tournamentChannel?.channelID ?? "");
        if (!(mappoolChannel && mappoolChannel.type === ChannelType.GuildForum))
            return true;
    
        const forumChannel = mappoolChannel as ForumChannel;
        const ids = {
            stop: randomUUID(),
            create: randomUUID(),
        }
        const threadMessage = await m.channel!.send({
            content: `Is there a thread for this map already? Or should I create one in <#${forumChannel.id}>? If there already is a thread, paste the thread's ID.`,
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(ids.stop)
                            .setLabel("STOP COMMAND")
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId(ids.create)
                            .setLabel("Create thread")
                            .setStyle(ButtonStyle.Primary))
                        
            ],
        });
        return new Promise<[ThreadChannel, Message] | undefined>((resolve) => {
            const filter = (msg: Message | MessageComponentInteraction) => (msg instanceof Message ? msg.author.id : msg.user.id) === (m instanceof Message ? m.author.id : m.user.id);
            const confirmationCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
            const idCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });
            confirmationCollector.on("collect", async (i: MessageComponentInteraction) => {
                if (i.customId === ids.stop) {
                    await i.reply("Stopped command.");
                    setTimeout(async () => await i.deleteReply(), 5000);
                    confirmationCollector.stop();
                    idCollector.stop();
                    resolve(undefined);
                } else if (i.customId === ids.create) {
                    await i.reply("Creating thread...");
                    const createObj: GuildForumThreadCreateOptions = {
                        name: `${slot} (${mappoolMap.customMappers.map(u => u.osu.username).join(", ")})`,
                        message: { content },
                    }
                    const tag = forumChannel.availableTags.find(t => t.name.toLowerCase() === "wip")?.id;
                    if (tag)
                        createObj.appliedTags = [tag];
                    const thread = await forumChannel.threads.create(createObj);
                    const threadMsg = await thread.fetchStarterMessage();
                    await i.deleteReply();
                    resolve([thread, threadMsg!]);
                    confirmationCollector.stop();
                    idCollector.stop();
                }
            });
    
            idCollector.on("collect", async (msg: Message) => {
                if (msg.content.match(/\d+/)) {
                    // Check if valid thread channel
                    const id = msg.content.match(/\d+/)![0];
                    const ch = await discordClient.channels.fetch(msg.content);
                    if (!ch || !(ch instanceof ThreadChannel) || ch.parentId !== forumChannel.id) {
                        const reply = await msg.reply(`Could not find thread channel with id ${id} <#${id}> within the forum channel <#${forumChannel.id}>`);
                        setTimeout(async () => await reply.delete(), 5000);
                        return;
                    }
                    
                    const wait = await m.channel!.send("Changing thread name... (this may take a while if rate limited)");
                    await ch.setName(`${slot} (${mappoolMap.customMappers.map(u => u.osu.username).join(", ")})`);
                    await wait.delete();
                    const threadMsg = await ch.send(content);
    
                    resolve([ch, threadMsg]);
                    confirmationCollector.stop();
                    idCollector.stop();
                }
            });
            idCollector.on("end", async () => {
                await threadMessage.delete();
                resolve(undefined);
            });
        });
    } else {
        const ch = await discordClient.channels.fetch(mappoolMap.customThreadID);
        if (!ch || !(ch instanceof ThreadChannel)) {
            if (m instanceof Message) m.reply(`Could not find thread for **${slot}** which should be <#${mappoolMap.customThreadID}> (ID: ${mappoolMap.customThreadID})`);
            else m.editReply(`Could not find thread for **${slot}** which should be <#${mappoolMap.customThreadID}> (ID: ${mappoolMap.customThreadID})`);
            return;
        }

        const thread = ch as ThreadChannel;
        await thread.setArchived(false);
        const threadMsg = await thread.messages.fetch(mappoolMap.customMessageID!);
        if (!threadMsg) {
            if (m instanceof Message) m.reply(`Could not find thread message for **${slot}** which should be https://discord.com/channels/${thread.guild.id}/${mappoolMap.customThreadID}/${mappoolMap.customMessageID} (ID: ${mappoolMap.customMessageID})`);
            else m.editReply(`Could not find thread message for **${slot}** which should be https://discord.com/channels/${thread.guild.id}/${mappoolMap.customThreadID}/${mappoolMap.customMessageID} (ID: ${mappoolMap.customMessageID})`);
            return;
        }

        const wait = await m.channel!.send("Changing thread name... (this may take up to 10 minutes if rate limited as discord API only allows bots to change thread names ~2 times per 10 min.)");
        await thread.setName(`${slot} (${mappoolMap.customMappers.map(u => u.osu.username).join(", ")})`);
        await wait.delete();
        await threadMsg.edit(content);

        return [thread, threadMsg];
    }
}

export async function fetchJobChannel (m: Message | ChatInputCommandInteraction, tournament: Tournament): Promise<ForumChannel | undefined> {
    const tourneyChannels = await TournamentChannel.find({
        where: {
            tournament: {
                ID: tournament.ID,
            }
        }
    });
    const tournamentChannel = tourneyChannels.find(c => c.channelType === TournamentChannelType.Jobboard);
    const jobChannel = discordClient.channels.cache.get(tournamentChannel?.channelID ?? "");
    if (!(jobChannel && jobChannel.type === ChannelType.GuildForum)) {
        if (m instanceof Message) m.reply(`Could not find job channel for tournament ${tournament.name}`);
        else m.editReply(`Could not find job channel for tournament ${tournament.name}`);
        return;
    }

    return jobChannel as ForumChannel;
}

export async function hasTournamentRoles (m: Message | ChatInputCommandInteraction, tournament: Tournament, targetRoles: TournamentRoleType[]): Promise<boolean> {
    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const allowedRoles = roles.filter(r => targetRoles.some(t => t === r.roleType));
    if (allowedRoles.length === 0) {
        if (m instanceof Message) m.reply(`There are no valid roles for this tournament. Please add ${targetRoles.map(t => t.toString()).join(", ")} roles first.`);
        else m.editReply(`There are no valid roles for this tournament. Please add ${targetRoles.map(t => t.toString()).join(", ")} roles first.`);
        return false;
    }

    // Check if user is a mappooler or organizer
    const allowed = (m.member!.roles as GuildMemberRoleManager).cache.hasAny(...allowedRoles.map(r => r.roleID));
    if (!allowed) {
        if (m instanceof Message) m.reply("You are not a mappooler or organizer for this tournament.");
        else m.editReply("You are not a mappooler or organizer for this tournament.");
        return false;
    }

    return true;
}

export async function isSecuredChannel (m: Message | ChatInputCommandInteraction, targetChannels: TournamentChannelType[]): Promise<boolean> {
    if (!m.guild)
        return false;

    const channel = await TournamentChannel.findOne({
        where: {
            channelID: m.channel && m.channel.isThread() ? m.channel.parentId! : m.channelId,
        },
    });
    if (!channel) {
        if (m instanceof Message) m.reply("This channel is not registered as a secured channel for any tournament. If this is a mistake, please have the tournament admins/organizers add this channel as a secured channel for the tournament with the applicable channel type.");
        else m.editReply("This channel is not registered as a secured channel for any tournament. If this is a mistake, please have the tournament admins/organizers add this channel as a secured channel for the tournament with the applicable channel type.");
        return false;
    }

    // Check if the channel type is allowed
    const allowed = targetChannels.some(t => t === channel.channelType);
    if (!allowed) {
        if (m instanceof Message) m.reply(`This channel is not any of the following channel types: ${targetChannels.map(t => TournamentChannelType[t]).join(", ")}. If this is a mistake, please have the tournament admins/organizers add this channel as a secured channel for the tournament with the applicable channel type.`);
        else m.editReply(`This channel is not any of the following channel types: ${targetChannels.map(t => TournamentChannelType[t]).join(", ")}. If this is a mistake, please have the tournament admins/organizers add this channel as a secured channel for the tournament with the applicable channel type.`);
        return false;
    }

    return true;
}

export async function mappoolLog(tournament: Tournament, command: string, user: User, log: MappoolMapHistory, logSlot: MappoolSlot, logMappool: Mappool)
export async function mappoolLog(tournament: Tournament, command: string, user: User, event: string)
export async function mappoolLog(tournament: Tournament, command: string, user: User, logOrEvent: MappoolMapHistory | string, logSlot?: MappoolSlot, logMappool?: Mappool) {
    const tournamentChannels = await TournamentChannel.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const mappoolLogChannels = tournamentChannels.filter(c => c.channelType === TournamentChannelType.Mappoollog);
    if (mappoolLogChannels.length === 0)
        return;

    const embed = new EmbedBuilder();
    embed.setTitle(`\`${command}\` was run by ${user!.osu.username}`);

    if (logOrEvent instanceof MappoolMapHistory) {
        const log = logOrEvent;
        const slot = logSlot!;
        const mappool = logMappool!;
        embed.setDescription(`${log.link ? "Custom map" : "Beatmap" } was added to slot **${mappool.abbreviation.toUpperCase()} ${slot.acronym.toUpperCase()}${log.mappoolMap.order}**`);
        embed.addFields({ name: "Map", value: log.beatmap ? `${log.beatmap.beatmapset.artist} - ${log.beatmap.beatmapset.title} [${log.beatmap.difficulty}]` : `${log.artist} - ${log.title} [${log.difficulty}]`});
        if (log.link) embed.addFields({ name: "Link", value: log.link });
        embed.setThumbnail(log.beatmap ? `https://b.ppy.sh/thumb/${log.beatmap.beatmapset.ID}l.jpg` : null);
        embed.setColor(modeColour(tournament.mode.ID - 1));
        embed.setTimestamp();
    } else {
        const event = logOrEvent;
        embed.setDescription(event);
        embed.setColor(modeColour(tournament.mode.ID - 1));
        embed.setTimestamp();
    }

    await Promise.all(mappoolLogChannels.map(async channel => {
        const c = await discordClient.channels.fetch(channel.channelID);
        if (c)
            return (c as TextChannel).send({ embeds: [embed] });
    }));
}

// Function to confirm if they want to create another mappool for the same stage/round
export async function confirmCommand (m: Message | ChatInputCommandInteraction, content: string): Promise<boolean> {
    const ids = {
        yes: randomUUID(),
        no: randomUUID(),
    }
    const message = await m.channel!.send({
        content,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(ids.yes)
                        .setLabel("Yes")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(ids.no)
                        .setLabel("No")
                        .setStyle(ButtonStyle.Danger)),
        ],
    });

    return new Promise<boolean>(resolve => {
        const filter = (i: MessageComponentInteraction) => i.user.id === (m instanceof Message ? m.author.id : m.user.id);
        const confirmationCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
        confirmationCollector.on("collect", async (msg: Message | MessageComponentInteraction) => {
            if (msg instanceof MessageComponentInteraction) {
                if (msg.customId === ids.yes) {
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(true);
                }
                else if (msg.customId === ids.no) {
                    await message.delete();
                    confirmationCollector.stop();
                    resolve(false);
                }
            }
        });
    });
}