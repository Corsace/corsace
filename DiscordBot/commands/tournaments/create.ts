import { config } from "node-config-ts";
import { ActionRowBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits, SlashCommandBuilder, MessageComponentInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ChannelType } from "discord.js";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";
import { User } from "../../../Models/user";
import { Command } from "../index";
import { loginRow } from "../../functions/loginResponse";
import { filter, stopRow } from "../../functions/messageInteractionFunctions";
import { profanityFilter } from "../../../Interfaces/comment";
import { Stage, StageType } from "../../../Models/tournaments/stage";
import { Phase } from "../../../Models/phase";
import { TournamentChannel, TournamentChannelType } from "../../../Models/tournaments/tournamentChannel";
import { TournamentRole, TournamentRoleType } from "../../../Models/tournaments/tournamentRole";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild || !(m.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator))
        return;
    
    // Check if the server is already running 5 tournaments (the limit)
    const serverTournaments = await Tournament.find({
        where: [
            {
                server: m.guild.id,
                status: TournamentStatus.NotStarted,
            },
            {
                server: m.guild.id,
                status: TournamentStatus.Registrations,
            },
        ],
    });
    if (serverTournaments.length === 3) {
        await m.reply("You can only have 3 tournaments at a time!");
        return;
    }

    // Begin tournament creation
    const tournament = new Tournament();
    tournament.server = m.guild.id;
    tournament.stages = [];
    tournament.channels = [];
    tournament.roles = [];

    // Find server owner and assign them as the tournament organizer
    const organizer = await User.findOne({
        where: {
            discord: {
                userID: m.guild.ownerId,
            },
        },
    });
    if (!organizer) {
        await m.reply({
            content: "No user found in the corsace database for the server owner! Please have <@" + m.guild.ownerId + "> login to the Corsace website with your discord and osu! accounts!", 
            components: [loginRow],
        });
        return;
    }
    tournament.organizer = organizer;

    // Check for name validity
    const nameRegex = new RegExp(/-n [a-zA-Z0-9_ ]{3,32}/);
    const name = m instanceof Message ? nameRegex.exec(m.content)?.[0] : m.options.getString("name");
    if (!name) {
        await m.reply("Please provide a valid name for your tournament! You are only allowed the following characters: a-z, A-Z, 0-9, _, and spaces. The name must be between 3 and 32 characters long.");
        return;
    }
    if (profanityFilter.test(name)) {
        await m.reply("LMFAO! XD Shut the fuck up and give a valid name you fucking idiot (Nobody's laughing with you, fucking dumbass)");
        return;
    }
    tournament.name = name;

    // Check for abbreviation validity
    const abbreviationRegex = new RegExp(/-a [a-zA-Z0-9_]{3,8}/);
    const abbreviation = m instanceof Message ? abbreviationRegex.exec(m.content)?.[0] : m.options.getString("abbreviation");
    if (!abbreviation) {
        await m.reply("Please provide a valid abbreviation for your tournament! You are only allowed the following characters: a-z, A-Z, 0-9, and _. The abbreviation must be between 3 and 8 characters long.");
        return;
    }
    if (profanityFilter.test(abbreviation)) {
        await m.reply("The abbreviation is sus . Change it to something more appropriate.");
        return;
    }
    tournament.abbreviation = abbreviation;

    // Check for description validity
    const descriptionRegex = new RegExp(/-d [a-zA-Z0-9_ ]{3,512}/);
    const description = m instanceof Message ? descriptionRegex.exec(m.content)?.[0] : m.options.getString("description");
    if (!description) {
        await m.reply("Please provide a valid description for your tournament! You are only allowed the following characters: a-z, A-Z, 0-9, _, and spaces. The description must be between 3 and 512 characters long.");
        return;
    }
    if (profanityFilter.test(description)) {
        await m.reply("Write a description that doesn't sound like it was written by a 12 year old.");
        return;
    }
    tournament.description = description;

    // Check for mode validity
    const modeRegex = new RegExp(/-m [a-zA-Z0-9_ ]{1,14}/);
    const mode = m instanceof Message ? modeRegex.exec(m.content)?.[0] : m.options.getString("mode");
    if (!mode) {
        await m.reply("Please provide a valid mode for your tournament!");
        return;
    }
    let modeID = 0;
    switch (mode) {
        case "1":
        case "standard": 
        case "osu":
        case "osu!":
        case "osu!standard":
        case "osu!std":
        case "std":
            modeID = 1;
            break;
        case "2":
        case "taiko":
        case "osu!taiko":
        case "osu!tko":
        case "tko":
            modeID = 2;
            break;
        case "3":
        case "fruits":
        case "catch":
        case "catch the beat":
        case "osu!catch":
        case "osu!fruits":
        case "osu!ctb":
        case "ctb":
            modeID = 3;
            break;
        case "4":
        case "mania":
        case "osu!mania":
        case "osu!man":
        case "man":
            modeID = 4;
            break;
    }
    if (modeID === 0) {
        await m.reply("Please provide a valid mode for your tournament!");
        return;
    }

    const modeDivision = await ModeDivision.findOne({
        where: {
            ID: modeID,
        },
    });
    if (!modeDivision) {
        await m.reply("That mode does not exist!");
        return;
    }
    tournament.mode = modeDivision;

    // Check for match size validity
    const matchSizeRegex = new RegExp(/-ms [a-zA-Z0-9_ ]{1,3}/);
    if (m instanceof Message) {
        const matchSize = matchSizeRegex.exec(m.content)?.[0];
        if (!matchSize || parseInt(matchSize) > 16 || parseInt(matchSize) < 1) {
            await m.reply("Please provide a valid match size for your tournament!");
            return;
        }
        tournament.matchSize = parseInt(matchSize);
    } else {
        const matchSize = m.options.getInteger("match_size");
        if (!matchSize || matchSize > 8 || matchSize < 1) {
            await m.reply("Please provide a valid match size for your tournament!");
            return;
        }
        tournament.matchSize = matchSize;
    }

    // Check for min and max team size validity
    const teamSizeRegex = new RegExp(/-ts \d+ \d+/);
    let minSize: number | null = 0;
    let maxSize: number | null = 0;
    if (m instanceof Message) {
        const teamSize = teamSizeRegex.exec(m.content)?.[0];
        if (!teamSize) {
            await m.reply("Please provide a valid team size for your tournament!");
            return;
        }
        minSize = parseInt(teamSize[0]);
        maxSize = parseInt(teamSize[1]);
    } else {
        minSize = m.options.getInteger("min_team_size");
        maxSize = m.options.getInteger("max_team_size");
        if (!minSize || !maxSize) {
            await m.reply("Please provide a valid team size for your tournament!");
            return;
        }
    }
    if (minSize < 1 || minSize > 8 || minSize < tournament.matchSize || maxSize > 32 || minSize > maxSize) {
        await m.reply("Please provide a valid team size for your tournament!");
        return;
    }
    tournament.minTeamSize = minSize;
    tournament.maxTeamSize = maxSize;

    // Check for registration date validity
    const registrationRegex = new RegExp(/-r (\d{4}-\d{2}-\d{2}) (\d{4}-\d{2}-\d{2})/);
    const registrationStartText = m instanceof Message ? registrationRegex.exec(m.content)?.[1] : m.options.getString("registration_start");
    const registrationEndText = m instanceof Message ? registrationRegex.exec(m.content)?.[2] : m.options.getString("registration_end");
    if (!registrationStartText || !registrationEndText) {
        await m.reply("Please provide valid registration dates for your tournament! The format is `YYYY-MM-DD`.");
        return;
    }

    const registrationStart = new Date(registrationStartText);
    const registrationEnd = new Date(registrationEndText);
    if (isNaN(registrationStart.getTime()) || isNaN(registrationEnd.getTime()) || registrationStart.getTime() > registrationEnd.getTime() || registrationEnd.getTime() < Date.now()) {
        await m.reply("Please provide valid registration dates for your tournament and make sure the registration end date is actually after today! The format is `YYYY-MM-DD`.");
        return;
    }

    tournament.registrations = {} as Phase;
    tournament.registrations.start = registrationStart;
    tournament.registrations.end = registrationEnd;
    tournament.year = registrationEnd.getUTCFullYear();

    // Check for registration sort order validity
    const sortOrderRegex = new RegExp(/-s [a-zA-Z0-9_ ]{1,3}/);
    const sortOrder = m instanceof Message ? sortOrderRegex.exec(m.content)?.[0] : m.options.getString("sort_order");
    if (!sortOrder) {
        await m.reply("Please provide a valid sort order for your tournament!");
        return;
    }
    let sortOrderID = -1;
    switch (sortOrder) {
        case "signup":
            sortOrderID = 0;
            break;
        case "random":
            sortOrderID = 1;
            break;
        case "rank" || "pp":
            sortOrderID = 2;
            break;
        case "bws":
            sortOrderID = 3;
            break;
    }
    if (sortOrderID === -1) {
        await m.reply("Please provide a valid sort order for your tournament!");
        return;
    }
    tournament.regSortOrder = sortOrderID;

    // Check for qualifiers validity
    const qualifiersRegex = new RegExp(/-q Y/);
    const qualifiers = (m instanceof Message && qualifiersRegex.exec(m.content)?.[0] === "Y") || (m instanceof ChatInputCommandInteraction && m.options.getBoolean("qualifiers"));
    if (qualifiers) {
        const qualifiers = new Stage();
        qualifiers.name = "Qualifiers";
        qualifiers.abbreviation = "QL";
        qualifiers.order = 1;
        qualifiers.stageType = StageType.Qualifiers;
        qualifiers.timespan = {
            start: new Date(tournament.registrations.end.getTime() + 14 * 24 * 60 * 60 * 1000),
            end: new Date(tournament.registrations.end.getTime() + 21 * 24 * 60 * 60 * 1000),
        };
        tournament.stages = [qualifiers];
    }

    // Ask for extra tournament features, callbacks continue within functions
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();
    const message = await m.channel!.send("Alright let's get started!");
    if (qualifiers)
        await tournamentQualifiersPass(message, tournament);
    else
        await tournamentChannels(message, tournament);
    if (m instanceof ChatInputCommandInteraction)
        await m.deleteReply();
}

// Function to retrieve how many teams/players pass qualifiers
async function tournamentQualifiersPass (m: Message, tournament: Tournament) {
    const passMessage = await m.reply({
        content: "How many teams are expected to pass qualifiers? (Please enter a number >= 2.", 
        components: [stopRow],
    });
    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });	
    const collector = m.channel!.createMessageCollector({ filter, time: 600000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
        if (i.customId === "stop") {
            await i.reply("Tournament creation stopped.");
            stopped = true;
            collector.stop();
            componentCollector.stop();
            return;	
        }	
    });
    collector.on("collect", async (msg: Message) => {
        if (stopped) 
            return;

        if (isNaN(parseInt(msg.content)) || parseInt(msg.content) < 2) {
            const reply = await msg.reply("Invalid number of teams to pass qualifiers.");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }

        tournament.stages[0].initialSize = -1;
        tournament.stages[0].finalSize = parseInt(msg.content);

        stopped = true;
        collector.stop();
        componentCollector.stop();
        await msg.reply(`${tournament.stages[0].finalSize} teams to pass qualifiers saved.`);
        await tournamentChannels(m, tournament);
    });
    collector.on("end", async () => {
        await passMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to fetch and assign channels
async function tournamentChannels (m: Message, tournament: Tournament) {
    let stopped = false;
    const channelMessage = await m.reply({
        content: "Mention/paste a channel ID, and then write the designated tournament channel type it is for. (e.g. `#general general` or `#organizers admin`).\nIf you want the bot to create a channel for you, select a channel type from the dropdown below.\nIf you are done, press the `done` button.",
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("channel")
                        .setPlaceholder("Select a channel type")
                        .addOptions(
                            {
                                label: "General",
                                value: "General",
                                description: "Create a general tournament channel",
                            },
                            {
                                label: "Participants",
                                value: "Participants",
                                description: "Create a tournament participants channel",
                            },
                            {
                                label: "Managers",
                                value: "Managers",
                                description: "Create a tournament team managers channel",
                            },
                            {
                                label: "Announcements",
                                value: "Announcements",
                                description: "Create a tournament announcements channel (requires a community server)",
                            },
                            {
                                label: "Admin",
                                value: "Admin",
                                description: "Create a tournament admin channel",
                            },
                            {
                                label: "Mappool",
                                value: "Mappool",
                                description: "Create a tournament mappool channel",
                            },
                            {
                                label: "Mappool Log (For custom maps)",
                                value: "Mappoollog",
                                description: "Create a channel to log custom mappool changes",
                            },
                            {
                                label: "Mappool QA (For custom maps)",
                                value: "MappoolQA",
                                description: "Create a forum channel to QA any custom maps made for the tournament (requires a community server)",
                            },
                            {
                                label: "Testplayers",
                                value: "Testplayers",
                                description: "Create a tournament testplayer channel",
                            },
                            {
                                label: "Referees",
                                value: "Referees",
                                description: "Create a tournament referee channel",
                            },
                            {
                                label: "Streamers",
                                value: "Streamers",
                                description: "Create a tournament streamer channel",
                            },
                            {
                                label: "Match Results",
                                value: "MatchResults",
                                description: "Create a channel to log tournament match results",
                            })
                ),
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("stop")
                        .setLabel("STOP COMMAND")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId("done")
                        .setLabel("Done adding channels.")
                        .setStyle(ButtonStyle.Success)
                ),
        ],
    });

    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    const channelCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });

    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === "stop") {
            await i.reply("Tournament creation stopped.");
            stopped = true;
            componentCollector.stop();
            channelCollector.stop();
            return;
        }
        if (i.customId === "done") {
            await i.reply("Tournament channel designation has finished.");
            stopped = true;
            componentCollector.stop();
            channelCollector.stop();
            await tournamentRoles(m, tournament);
            return;
        }
        if (i.customId === "channel") {
            const channelTypeMenu = (i as StringSelectMenuInteraction).values[0];
            let channelType: ChannelType;
            switch (channelTypeMenu) {
                case "Announcements":
                    channelType = ChannelType.GuildAnnouncement;
                    break;
                case "MappoolQA":
                    channelType = ChannelType.GuildForum;
                    break;
                default:
                    channelType = ChannelType.GuildText;
                    break;
            }
            try {
                const channel = await m.guild!.channels.create({
                    type: channelType,
                    name: `${tournament.abbreviation}-${channelTypeMenu}`,
                    topic: `Tournament ${tournament.name} ${channelType} channel`,
                    reason: `${tournament.name} channel created by ${m.author.tag} for ${(i as StringSelectMenuInteraction).values[0]} purposes.`,
                });
                
                const tournamentChannel = new TournamentChannel();
                tournamentChannel.channelID = channel.id;
                tournamentChannel.channelType = TournamentChannelType[channelTypeMenu];
                tournament.channels!.push(tournamentChannel);

                await i.reply(`Created channel <#${channel.id}> for \`${channelTypeMenu}\`.`);
            } catch (e) {
                await i.reply("Failed to create channel. If you are creating an announcement or mappool qa channel, you need to turn your server into a community server. Error below:\n```" + e + "```");
            }
        }
    });

    channelCollector.on("collect", async (msg: Message) => {
        if (stopped)
            return;

        const channel = msg.mentions.channels.first() || m.guild!.channels.cache.get(msg.content.split(" ")[0]);
        if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement && channel.type !== ChannelType.GuildForum)) {
            const reply = await msg.reply("Invalid channel.");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }
        const channelType = msg.content.split(" ")[1].charAt(0).toUpperCase() + msg.content.split(" ")[1].slice(1);
        if (!channelType || TournamentChannelType[channelType] === undefined || (channelType === "announcements" && channel.type !== ChannelType.GuildAnnouncement) || (channelType === "mappoolQA" && channel.type !== ChannelType.GuildForum)) {
            const reply = await msg.reply(`Invalid channel type ${channelType}.\nAnnouncements should be a guild announcement channel.\nMappool QA should be a guild forum channel.`);
            setTimeout(async () => reply.delete(), 5000);
            return;
        }
        const tournamentChannel = new TournamentChannel();
        tournamentChannel.channelID = channel.id;
        tournamentChannel.channelType = TournamentChannelType[channelType];
        tournament.channels!.push(tournamentChannel);

        await msg.reply(`Channel <#${channel.id}> designated for \`${channelType}\`.`);
    });
    channelCollector.on("end", async () => {
        await channelMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
        return;
    });
}

// Function to fetch and assign roles
async function tournamentRoles (m: Message, tournament: Tournament) {
    tournament.roles = [];

    let stopped = false;
    const roleMessage = await m.reply({
        content: "Mention/paste a role ID, and then write the designated tournament role it is for. (e.g. `1024037229250744411 participants`).\nIf you want the bot to create a role for you, select a role type from the dropdown below.\nIf you are done, press the `done` button.",
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("role")
                        .setPlaceholder("Select a role type")
                        .addOptions(
                            {
                                label: "Participants",
                                value: "Participants",
                                description: "Create a tournament participant role",
                            },
                            {
                                label: "Staff",
                                value: "Staff",
                                description: "Create a tournament staff role",
                            },
                            {
                                label: "Managers",
                                value: "Managers",
                                description: "Create a team manager role",
                            },
                            {
                                label: "Mappoolers",
                                value: "Mappoolers",
                                description: "Create a mappooler role",
                            },
                            {
                                label: "Mappers",
                                value: "Mappers",
                                description: "Create a mapper role",
                            },
                            {
                                label: "Testplayers",
                                value: "Testplayers",
                                description: "Create a testplayer role",
                            },
                            {
                                label: "Referees",
                                value: "Referees",
                                description: "Create a referee role",
                            },
                            {
                                label: "Streamers",
                                value: "Streamers",
                                description: "Create a streamer role",
                            },
                            {
                                label: "Commentators",
                                value: "Commentators",
                                description: "Create a commentator role",
                            })
                ),
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("stop")
                        .setLabel("STOP COMMAND")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId("done")
                        .setLabel("Done adding roles.")
                        .setStyle(ButtonStyle.Success)
                ),
        ],
    });

    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    const roleCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });

    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (stopped)
            return;

        if (i.customId === "stop") {
            await i.reply("Tournament creation stopped.");
            stopped = true;
            componentCollector.stop();
            roleCollector.stop();
            return;
        }
        if (i.customId === "done") {
            await i.reply("Tournament role designation has finished.");
            stopped = true;
            componentCollector.stop();
            roleCollector.stop();
            if (m.guild!.id === config.discord.guild)
                await tournamentCorsace(m, tournament);
            else
                await tournamentSave(m, tournament);
            return;
        }
        if (i.customId === "role") {
            const roleType = (i as StringSelectMenuInteraction).values[0];
            try {
                const role = await m.guild!.roles.create({
                    name: `${tournament.name} ${roleType}`,
                    reason: `Created by ${m.author.tag} for tournament ${tournament.name}`,
                    mentionable: true,
                });
                const tournamentRole = new TournamentRole();
                tournamentRole.roleID = role.id;
                tournamentRole.roleType = TournamentRoleType[roleType];
                tournament.roles!.push(tournamentRole);

                await i.reply(`Created role <@&${role.id}> for \`${roleType}\`.`);
            } catch (e) {
                await i.reply("Failed to create role.\n```" + e + "```");
            }
        }
    });

    roleCollector.on("collect", async (msg: Message) => {
        if (stopped)
            return;

        const role = msg.mentions.roles.first() || m.guild!.roles.cache.get(msg.content.split(" ")[0]);
        if (!role) {
            const reply = await msg.reply("Invalid role.");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }
        const roleType = msg.content.split(" ")[1].charAt(0).toUpperCase() + msg.content.split(" ")[1].slice(1);
        if (TournamentRoleType[roleType] === undefined) {
            const reply = await msg.reply(`Invalid role type ${roleType}.`);
            setTimeout(async () => reply.delete(), 5000);
            return;
        }
        const tournamentRole = new TournamentRole();
        tournamentRole.roleID = role.id;
        tournamentRole.roleType = TournamentRoleType[roleType];
        tournament.roles!.push(tournamentRole);

        await msg.reply(`Designated role \`${role.name} (${role.id})\` for \`${roleType}\`.`);
    });
    roleCollector.on("end", async () => {
        await roleMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to fetch and toggle corsace
async function tournamentCorsace (m: Message, tournament: Tournament) {
    const corsaceRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("corsace")
                .setPlaceholder("Select a corsace option")
                .addOptions(
                    {
                        label: "No Corsace",
                        value: "No",
                        description: "No corsace",
                    },
                    {
                        label: "Corsace Open",
                        value: "open",
                        description: "This is for Corsace Open",
                    },
                    {
                        label: "Corsace Closed",
                        value: "closed",
                        description: "This is for Corsace Closed",
                    }
                )
        );
    const corsaceMessage = await m.reply({
        content: "Is this a Corsace tournament?",
        components: [corsaceRow, stopRow],
    });
    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === "stop") {
            stopped = true;
            componentCollector.stop();
            await i.reply("Tournament creation stopped.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            return;
        }
        const corsaceType = (i as StringSelectMenuInteraction).values[0];
        tournament.isOpen = corsaceType === "open";
        tournament.isClosed = tournament.invitational = corsaceType === "closed";

        stopped = true;
        componentCollector.stop();
        await i.reply("Corsace option of `" + corsaceType + "` saved.\n");
        setTimeout(async () => (await i.deleteReply()), 5000);
        await tournamentSave(m, tournament);
    });
    componentCollector.on("end", async () => {
        await corsaceMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to save the tournament
async function tournamentSave (m: Message, tournament: Tournament) {
    await tournament.save();
    await Promise.all(tournament.stages.map(async s => {
        s.tournament = tournament;
        return s.save();
    }));
    await Promise.all(tournament.channels!.map(async c => {
        c.tournament = tournament;
        return c.save();
    }));
    await Promise.all(tournament.roles!.map(async r => {
        r.tournament = tournament;
        return r.save();
    }));
    const embed = new EmbedBuilder()
        .setTitle(tournament.name)
        .setDescription(tournament.description)
        .addFields(
            { name: "Mode", value: tournament.mode.name, inline: true },
            { name: "Match Size", value: tournament.matchSize.toString(), inline: true },
            { name: "Allowed Team Size", value: `${tournament.minTeamSize} - ${tournament.maxTeamSize}`, inline: true },
            { name: "Registration Start Date", value: tournament.registrations.start.toUTCString(), inline: true },
            { name: "Qualifiers", value: tournament.stages.some(q => q.stageType === StageType.Qualifiers).toString(), inline: true },
            { name: "Invitational", value: tournament.invitational ? "Yes" : "No", inline: true },
            { name: "Server", value: tournament.server, inline: true }
        )
        .setTimestamp(new Date)
        .setAuthor({ name: m.author.tag, iconURL: m.author.avatarURL() ?? undefined });

    if (tournament.isOpen || tournament.isClosed)
        embed.addFields(
            { name: "Corsace", value: tournament.isOpen ? "Open" : "Closed", inline: true }
        );

    m.reply({ content: "Congratulations on saving your tournament! :tada:\nHere is the tournament embed:", embeds: [embed] });
}

const data = new SlashCommandBuilder()
    .setName("create_tournament")
    .setDescription("Create a tournament")
    .addStringOption(option =>
        option.setName("name")
            .setDescription("The name of the tournament")
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(32))
    .addStringOption(option =>
        option.setName("abbreviation")
            .setDescription("The short form of the tournament name. Example: `Corsace Open 2021` -> `CO21`")
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(8))
    .addStringOption(option =>
        option.setName("description")
            .setDescription("The description of the tournament")
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(512))
    .addStringOption(option =>
        option.setName("mode")
            .setDescription("The mode of the tournament")
            .setRequired(true)
            .addChoices(
                { name: "Standard", value: "std" },
                { name: "Taiko", value: "tko" },
                { name: "Catch", value: "ctb" },
                { name: "Mania", value: "man" }
            ))
    .addIntegerOption(option =>
        option.setName("match_size")
            .setDescription("The match size of the tournament")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(16))
    .addIntegerOption(option =>
        option.setName("min_team_size")
            .setDescription("The minimum team size of the tournament")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(16))
    .addIntegerOption(option =>
        option.setName("max_team_size")
            .setDescription("The maximum team size of the tournament")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(16))
    .addStringOption(option =>
        option.setName("registration_start")
            .setDescription("The registration start date of the tournament in YYYY-MM-DD (e.g. 2024-01-01)")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("registration_end")
            .setDescription("The registration end date of the tournament in YYYY-MM-DD (e.g. 2024-01-02)")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("sort_order")
            .setDescription("The sort order of the tournament")
            .setRequired(true)
            .addChoices(
                { name: "Signup Order", value: "signup" },
                { name: "Random", value: "random" },
                { name: "Rank/PP", value: "rankpp" },
                { name: "BWS Rank", value: "bws" }
            ))
    .addBooleanOption(option =>
        option.setName("qualifiers")
            .setDescription("Does the tournament have qualifiers?")
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

const tournamentCreate: Command = {
    data,
    alternativeNames: ["tournament_create", "tournamentc", "ctournament", "createt", "tcreate", "createtournament", "tournamentcreate", "create-tournament", "tournament-create"],
    category: "tournaments",
    run,
};

export default tournamentCreate;