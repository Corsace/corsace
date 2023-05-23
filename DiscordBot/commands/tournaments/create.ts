import { config } from "node-config-ts";
import { ActionRowBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits, SlashCommandBuilder, MessageComponentInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ChannelType, GuildChannelCreateOptions, ForumChannel } from "discord.js";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";
import { User } from "../../../Models/user";
import { Command } from "../index";
import { loginResponse } from "../../functions/loginResponse";
import { filter, stopRow, timedOut } from "../../functions/messageInteractionFunctions";
import { profanityFilter } from "../../../Interfaces/comment";
import { Stage, StageType } from "../../../Models/tournaments/stage";
import { Phase } from "../../../Models/phase";
import { TournamentChannel, TournamentChannelType, TournamentChannelTypeRoles, forumTags } from "../../../Models/tournaments/tournamentChannel";
import { TournamentRole, TournamentRoleType } from "../../../Models/tournaments/tournamentRole";
import { randomUUID } from "crypto";
import respond from "../../functions/respond";
import commandUser from "../../functions/commandUser";
import getUser from "../../functions/dbFunctions/getUser";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild || !(m.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator))
        return;
    
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const nameRegex = new RegExp(/-n ([a-zA-Z0-9_ ]{3,32})/);
    const abbreviationRegex = new RegExp(/-a ([a-zA-Z0-9_]{3,8})/);
    const descriptionRegex = new RegExp(/-d ([a-zA-Z0-9_ ]{3,512})/);
    const modeRegex = new RegExp(/-m ([a-zA-Z0-9_ ]{1,14})/);
    const matchSizeRegex = new RegExp(/-ms ([a-zA-Z0-9_ ]{1,3})/);
    const teamSizeRegex = new RegExp(/-ts (\d+) (\d+)/);
    const registrationRegex = new RegExp(/-r ((?:\d{4}-\d{2}-\d{2})|\d{10}) ((?:\d{4}-\d{2}-\d{2})|\d{10})/);
    const sortOrderRegex = new RegExp(/-s ([a-zA-Z0-9_ ]{1,6})/);
    const helpRegex = new RegExp(/-h/);
    if (m instanceof Message && (helpRegex.test(m.content) || (!nameRegex.test(m.content) && !abbreviationRegex.test(m.content) && !descriptionRegex.test(m.content) && !modeRegex.test(m.content) && !matchSizeRegex.test(m.content) && !teamSizeRegex.test(m.content) && !registrationRegex.test(m.content) && !sortOrderRegex.test(m.content)))) {
        await m.reply(`Please provide all required parameters! Here is a list of them:\n**Name:** \`-n <name>\`\n**Abbreviation:** \`-a <abbreviation>\`\n**Description:** \`-d <description>\`\n**Mode:** \`-m <mode>\`\n**Match Size (xvx, input x):** \`-ms <match size>\`\n**Team Size:** \`-ts <min> <max>\`\n**Registration Period:** \`-r <start date (YYYY-MM-DD OR unix/epoch)> <end date (YYYY-MM-DD OR unix/epoch)>\`\n**Team Sort Order:** \`-s <sort order>\`\n\nIt is recommended to use slash commands for any \`create\` command.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/).`);
        return;
    }

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
        await respond(m, "You can only have 3 tournaments at a time!");
        return;
    }

    // Begin tournament creation
    const tournament = new Tournament();
    tournament.server = m.guild.id;
    tournament.stages = [];
    tournament.channels = [];
    tournament.roles = [];

    // Find server owner and assign them as the tournament organizer
    const creator = await getUser(commandUser(m).id, "discord", false);
    if (!creator) {
        await loginResponse(m);
        return;
    }

    let organizerTarget =  m instanceof Message ? m.mentions.users.first() : m.options.getUser("organizer");
    const organizer = organizerTarget ? await getUser(organizerTarget.id, "discord", false) : creator;
    if (!organizer) {
        // organizerTarget exists in this case because creator cannot be null / undefined.
        await loginResponse(m, "No user found in the corsace database for <@" + organizerTarget!.id+ ">! Please have them login to the Corsace website with their discord and osu! accounts!");
        return;
    }
    tournament.organizer = organizer;

    // Check for name validity
    const name = m instanceof Message ? nameRegex.exec(m.content)?.[1] : m.options.getString("name");
    if (!name) {
        await respond(m, "Please provide a valid name for your tournament! You are only allowed the following characters: a-z, A-Z, 0-9, _, and spaces. The name must be between 3 and 32 characters long.");
        return;
    }
    if (profanityFilter.test(name)) {
        await respond(m, "LMFAO! XD Shut the fuck up and give a valid name you fucking idiot (Nobody's laughing with you, fucking dumbass)");
        return;
    }
    tournament.name = name;

    // Check for abbreviation validity
    const abbreviation = m instanceof Message ? abbreviationRegex.exec(m.content)?.[1] : m.options.getString("abbreviation");
    if (!abbreviation) {
        await respond(m, "Please provide a valid abbreviation for your tournament! You are only allowed the following characters: a-z, A-Z, 0-9, and _. The abbreviation must be between 3 and 8 characters long.");
        return;
    }
    if (profanityFilter.test(abbreviation)) {
        await respond(m, "The abbreviation is sus . Change it to something more appropriate.");
        return;
    }
    tournament.abbreviation = abbreviation;

    // Check for description validity
    const description = m instanceof Message ? descriptionRegex.exec(m.content)?.[1] : m.options.getString("description");
    if (!description) {
        await respond(m, "Please provide a valid description for your tournament! You are only allowed the following characters: a-z, A-Z, 0-9, _, and spaces. The description must be between 3 and 512 characters long.");
        return;
    }
    if (profanityFilter.test(description)) {
        await respond(m, "Write a description that doesn't sound like it was written by a 15 year old.");
        return;
    }
    tournament.description = description;

    // Check for mode validity
    const mode = m instanceof Message ? modeRegex.exec(m.content)?.[1] : m.options.getString("mode");
    if (mode === null || mode === undefined) {
        await respond(m, "Please provide a valid mode for your tournament! It is currently missing.");
        return;
    }
    let modeID = 0;
    switch (mode.trim().toLowerCase()) {
        case "0":
        case "standard": 
        case "osu":
        case "osu!":
        case "osu!standard":
        case "osu!std":
        case "std":
            modeID = 1;
            break;
        case "1":
        case "taiko":
        case "osu!taiko":
        case "osu!tko":
        case "tko":
            modeID = 2;
            break;
        case "2":
        case "fruits":
        case "catch":
        case "catch the beat":
        case "osu!catch":
        case "osu!fruits":
        case "osu!ctb":
        case "ctb":
            modeID = 3;
            break;
        case "3":
        case "mania":
        case "osu!mania":
        case "osu!man":
        case "man":
            modeID = 4;
            break;
    }
    if (modeID === 0) {
        await respond(m, "Please provide a valid mode for your tournament! It is currently invalid.");
        return;
    }

    const modeDivision = await ModeDivision.findOne({
        where: {
            ID: modeID,
        },
    });
    if (!modeDivision) {
        await respond(m, "That mode does not exist!");
        return;
    }
    tournament.mode = modeDivision;

    // Check for match size validity
    let matchSize = m instanceof Message ? matchSizeRegex.exec(m.content)?.[1] : m.options.getInteger("players_in_match");
    if (!matchSize) {
        await respond(m, "Please provide a valid match size for your tournament! It is currently missing.");
        return;
    }
    matchSize = typeof matchSize === "string" ? parseInt(matchSize) : matchSize;
    if (isNaN(matchSize) || matchSize < 1 || matchSize > 16) {
        await respond(m, "Please provide a valid match size for your tournament! It is currently invalid.");
        return;
    }
    tournament.matchSize = matchSize;

    // Check for min and max team size validity
    let minSize: number | null = 0;
    let maxSize: number | null = 0;
    if (m instanceof Message) {
        const teamSize = teamSizeRegex.exec(m.content);
        if (!teamSize) {
            await m.reply("Please provide a valid team size for your tournament!");
            return;
        }
        minSize = parseInt(teamSize[1]);
        maxSize = parseInt(teamSize[2]);
    } else {
        minSize = m.options.getInteger("min_players");
        maxSize = m.options.getInteger("max_players");
        if (!minSize || !maxSize) {
            await m.editReply("Please provide a valid team size for your tournament!");
            return;
        }
    }
    if (minSize < 1 || minSize > 16 || minSize < tournament.matchSize || maxSize > 32 || minSize > maxSize) {
        await respond(m, "Please provide a valid team size for your tournament!");
        return;
    }
    tournament.minTeamSize = minSize;
    tournament.maxTeamSize = maxSize;

    // Check for registration date validity
    const registrationStartText = m instanceof Message ? registrationRegex.exec(m.content)?.[1] : m.options.getString("registration_start");
    const registrationEndText = m instanceof Message ? registrationRegex.exec(m.content)?.[2] : m.options.getString("registration_end");
    if (!registrationStartText || !registrationEndText) {
        await respond(m, "Please provide valid registration dates for your tournament! The format is `YYYY-MM-DD` or a unix/epoch timestamp in seconds.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/).");
        return;
    }

    const registrationStart = new Date(registrationStartText.includes("-") ? registrationStartText : parseInt(registrationStartText + "000"));
    const registrationEnd = new Date(registrationEndText.includes("-") ? registrationEndText : parseInt(registrationEndText + "000"));
    if (isNaN(registrationStart.getTime()) || isNaN(registrationEnd.getTime()) || registrationStart.getTime() > registrationEnd.getTime() || registrationEnd.getTime() < Date.now()) {
        await respond(m, "Please provide valid registration dates for your tournament and make sure the registration end date is actually after today! The format is `YYYY-MM-DD` or a unix/epoch timestamp in seconds.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/).");
        return;
    }

    tournament.registrations = {} as Phase;
    tournament.registrations.start = registrationStart;
    tournament.registrations.end = registrationEnd;
    tournament.year = registrationEnd.getUTCFullYear();

    // Check for registration sort order validity
    const sortOrder = m instanceof Message ? sortOrderRegex.exec(m.content)?.[1] : m.options.getString("team_sort_order");
    if (!sortOrder) {
        await respond(m, "Please provide a valid sort order for your tournament!");
        return;
    }
    let sortOrderID = -1;
    switch (sortOrder.trim().toLowerCase()) {
        case "signup":
            sortOrderID = 0;
            break;
        case "random":
            sortOrderID = 1;
            break;
        case "rank":
        case "pp":
        case "rankpp":
            sortOrderID = 2;
            break;
        case "bws":
            sortOrderID = 3;
            break;
    }
    if (sortOrderID === -1) {
        await respond(m, "Please provide a valid sort order for your tournament!");
        return;
    }
    tournament.regSortOrder = sortOrderID;

    // Check for qualifiers validity
    const qualifiersRegex = new RegExp(/-q Y/);
    const qualifiers = (m instanceof Message && qualifiersRegex.test(m.content)) || (m instanceof ChatInputCommandInteraction && m.options.getBoolean("qualifiers"));
    if (qualifiers) {
        const qualifiers = new Stage();
        qualifiers.name = "Qualifiers";
        qualifiers.abbreviation = "QL";
        qualifiers.createdBy = creator;
        qualifiers.order = 1;
        qualifiers.stageType = StageType.Qualifiers;
        qualifiers.timespan = {
            start: new Date(tournament.registrations.end.getTime() + 14 * 24 * 60 * 60 * 1000),
            end: new Date(tournament.registrations.end.getTime() + 21 * 24 * 60 * 60 * 1000),
        };
        tournament.stages = [qualifiers];
    }

    const message = await respond(m, "Alright let's get started!");
    if (qualifiers)
        await tournamentQualifiersPass(message, tournament, creator);
    else
        await tournamentRoles(message, tournament, creator);
}

// Function to retrieve how many teams/players pass qualifiers
async function tournamentQualifiersPass (m: Message, tournament: Tournament, creator: User) {
    const [id, stop] = stopRow();
    const passMessage = await m.reply({
        content: "How many teams are expected to pass qualifiers? (Please enter a number >= 2.)", 
        components: [stop],
    });
    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });	
    const collector = m.channel!.createMessageCollector({ filter, time: 6000000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
        if (i.customId === id) {
            const reply = await i.reply("Tournament creation stopped.");
            setTimeout(async () => reply.delete(), 5000);
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
        const reply = await msg.reply(`${tournament.stages[0].finalSize} teams to pass qualifiers saved.`);
        setTimeout(async () => reply.delete(), 5000);
        await tournamentRoles(m, tournament, creator);
    });
    collector.on("end", () => timedOut(passMessage, stopped, "Tournament creation"));
}

// Function to fetch and assign roles
async function tournamentRoles (m: Message, tournament: Tournament, creator: User) {
    tournament.roles = [];

    let stopped = false;
    let content = "Mention/paste a role ID, and then write the designated tournament role it is for. (e.g. `1024037229250744411 participants`).\n\nIf you want the bot to create a role for you, select a role type from the dropdown below.\nIf you are done, press the `done` button.\nAny roles with administrator privileges are automatically assigned as `Organizer`.\n";

    // Find all roles in the server and assign them as organizer tournament roles
    const roles = m.guild!.roles.cache.filter(r => r.permissions.has(PermissionFlagsBits.Administrator));
    for (const role of roles.toJSON()) {
        const tournamentRole = new TournamentRole();
        tournamentRole.createdBy = creator;
        tournamentRole.roleID = role.id;
        tournamentRole.roleType = TournamentRoleType.Organizer;
        tournament.roles!.push(tournamentRole);

        content += `\nDesignated role \`${role.name} (${role.id})\` for \`Organizer\`.`;
    }

    const ids = {
        "role": randomUUID(),
        "stop": randomUUID(),
        "done": randomUUID(),
    }
    const roleMessage = await m.reply({
        content,
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(ids.role)
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
                        .setCustomId(ids.stop)
                        .setLabel("STOP COMMAND")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(ids.done)
                        .setLabel("Done adding roles")
                        .setStyle(ButtonStyle.Success)
                ),
        ],
    });

    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    const roleCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });

    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (stopped)
            return;

        if (i.customId === ids.stop) {
            await i.reply("Tournament creation stopped.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            roleCollector.stop();
            return;
        }
        if (i.customId === ids.done) {
            await i.reply("Tournament role designation has finished.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            roleCollector.stop();
            await tournamentChannels(m, tournament, creator);
            return;
        }
        if (i.customId === ids.role) {
            const roleString = (i as StringSelectMenuInteraction).values[0];
            const roleType = TournamentRoleType[roleString];
            if (tournament.roles!.find(r => r.roleType === roleType)) {
                await i.reply("A role with this type already exists.\n If you want to create another role with this type, manually create it and then mention it here.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            const role = await m.guild!.roles.create({
                name: `${tournament.name} ${roleString}`,
                reason: `Created by ${m.author.tag} for tournament ${tournament.name}`,
                mentionable: true,
            });
            const tournamentRole = new TournamentRole();
            tournamentRole.createdBy = creator;
            tournamentRole.roleID = role.id;
            tournamentRole.roleType = roleType;
            tournament.roles!.push(tournamentRole);

            content += `\nCreated role <@&${role.id}> for \`${roleString}\`.`;
            await roleMessage.edit(content);
            await i.reply(`Created role <@&${role.id}> for \`${roleString}\`.`);
            setTimeout(async () => (await i.deleteReply()), 5000);
        }
    });

    roleCollector.on("collect", async (msg: Message) => {
        if (stopped)
            return;

        const role = msg.mentions.roles.first() || m.guild!.roles.cache.get(msg.content.split(" ")[0]);
        if (!role) {
            const reply = await msg.reply("Invalid role.");
            setTimeout(async () => {
                reply.delete();
                msg.delete();
            }, 5000);
            return;
        }
        const roleType = msg.content.split(" ")[1].charAt(0).toUpperCase() + msg.content.split(" ")[1].slice(1);
        if (TournamentRoleType[roleType] === undefined) {
            const reply = await msg.reply(`Invalid role type ${roleType}.`);
            setTimeout(async () => {
                reply.delete();
                msg.delete();
            }, 5000);
            return;
        }
        const dupeRole = tournament.roles!.find(r => r.roleID === role.id);
        if (dupeRole) {
            const reply = await msg.reply(`${role.name} (${role.id}) is already designated as \`${TournamentRoleType[dupeRole.roleType]}\`.`);
            setTimeout(async () => {
                reply.delete();
                msg.delete();
            }, 5000);
            return;
        }
        const tournamentRole = new TournamentRole();
        tournamentRole.roleID = role.id;
        tournamentRole.roleType = TournamentRoleType[roleType];
        tournament.roles!.push(tournamentRole);

        content += `\nDesignated role \`${role.name} (${role.id})\` for \`${roleType}\`.`;
        await roleMessage.edit(content);
        const reply = await msg.reply(`Designated role \`${role.name} (${role.id})\` for \`${roleType}\`.`);
        setTimeout(async () => {
            reply.delete();
            msg.delete();
        }, 5000);
    });
    roleCollector.on("end", () => timedOut(roleMessage, stopped, "Tournament creation"));
}

// Function to fetch and assign channels
async function tournamentChannels (m: Message, tournament: Tournament, creator: User) {
    let stopped = false;
    let content = "Mention/paste a channel ID, and then write the designated tournament channel type it is for. (e.g. `#general general` or `#organizers admin`).\n\nIf you want the bot to create a channel for you, select a channel type from the dropdown below.\nIf you are done, press the `done` button.\n";
    const ids = {
        "channel": randomUUID(),
        "stop": randomUUID(),
        "done": randomUUID(),
    }
    const channelMessage = await m.reply({
        content,
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(ids.channel)
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
                                label: "Mappool Log",
                                value: "Mappoollog",
                                description: "Create a channel to log any mappool changes",
                            },
                            {
                                label: "Mappool QA (For custom maps)",
                                value: "Mappoolqa",
                                description: "Create a forum channel to QA any custom maps made for the tournament (requires a community server)",
                            },
                            {
                                label: "Job Board (For custom maps)",
                                value: "Jobboard",
                                description: "Create a forum channel for mappers to find open slots and specs (requires a community server)",
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
                                value: "Matchresults",
                                description: "Create a channel to log tournament match results",
                            })
                ),
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(ids.stop)
                        .setLabel("STOP COMMAND")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(ids.done)
                        .setLabel("Done adding channels")
                        .setStyle(ButtonStyle.Success)
                ),
        ],
    });

    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    const channelCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });

    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === ids.stop) {
            await i.reply("Tournament creation stopped.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            channelCollector.stop();
            return;
        }
        if (i.customId === ids.done) {
            await i.reply("Tournament channel designation has finished.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            channelCollector.stop();
            if (m.guild!.id === config.discord.guild)
                await tournamentCorsace(m, tournament);
            else
                await tournamentSave(m, tournament);
            return;
        }
        if (i.customId === ids.channel) {
            const channelTypeMenu = (i as StringSelectMenuInteraction).values[0];
            const tournamentChannelType = TournamentChannelType[channelTypeMenu];
            if (tournament.channels!.find(c => c.channelType === tournamentChannelType)) {
                await i.reply("A channel of this type has already been designated. If you want to create another channel of this type, manually create it and then mention it here.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }

            let channelType = ChannelType.GuildText;
            if (channelTypeMenu === "Announcements")
                channelType = ChannelType.GuildAnnouncement;
            else if (channelTypeMenu === "Jobboard" || channelTypeMenu === "Mappoolqa")
                channelType = ChannelType.GuildForum;

            const tournamentChannel = new TournamentChannel();
            tournamentChannel.channelType = tournamentChannelType;

            const channelObject: GuildChannelCreateOptions = {
                type: channelType,
                name: `${tournament.abbreviation}-${channelTypeMenu}`,
                topic: `Tournament ${tournament.name} channel for ${channelTypeMenu}`,
                reason: `${tournament.name} channel created by ${m.author.tag} for ${(i as StringSelectMenuInteraction).values[0]} purposes.`,
                defaultAutoArchiveDuration: 10080,
            };

            const allowedRoleTypes = TournamentChannelTypeRoles[tournamentChannel.channelType];
            if (allowedRoleTypes !== undefined) {
                channelObject.permissionOverwrites = [
                    {
                        id: m.guild!.id, // the ID of the @everyone role is the same as the guild ID
                        deny: PermissionFlagsBits.ViewChannel,
                    },
                ];
                const allowedRoles = tournament.roles!.filter(r => allowedRoleTypes.includes(r.roleType));
                channelObject.permissionOverwrites.push(...allowedRoles.map(r => {
                    return {
                        id: r.roleID,
                        allow: PermissionFlagsBits.ViewChannel,
                    };
                }));
                

                if (tournamentChannel.channelType === TournamentChannelType.Mappoollog)
                    channelObject.permissionOverwrites[0].deny = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages;
            }

            if (channelTypeMenu === "Mappoolqa")
                channelObject.availableTags = [{
                    name: "WIP",
                    moderated: true,
                },{
                    name: "Finished",
                    moderated: true,
                },{
                    name: "Late",
                    moderated: true,
                },{
                    name: "Needs HS",
                    moderated: true,
                }];
            else if (channelTypeMenu === "Jobboard")
                channelObject.availableTags = [{
                    name: "Open",
                    moderated: true,
                },{
                    name: "Closed",
                    moderated: true,
                },{
                    name: "To Assign",
                    moderated: true,
                }];

            const channel = await m.guild!.channels.create(channelObject);

            tournamentChannel.channelID = channel.id;
            tournament.channels!.push(tournamentChannel);

            content += `\nCreated channel <#${channel.id}> for \`${channelTypeMenu}\`.`;
            await channelMessage.edit(content);
            await i.reply(`Created channel <#${channel.id}> for \`${channelTypeMenu}\`.`);
            setTimeout(async () => (await i.deleteReply()), 5000);
        }
    });

    channelCollector.on("collect", async (msg: Message) => {
        if (stopped)
            return;

        const channel = msg.mentions.channels.first() || m.guild!.channels.cache.get(msg.content.split(" ")[0]);
        if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement && channel.type !== ChannelType.GuildForum)) {
            const reply = await msg.reply("Invalid channel.");
            setTimeout(async () => {
                reply.delete();
                msg.delete();
            }, 5000);
            return;
        }
        const channelType = msg.content.split(" ")[1].charAt(0).toUpperCase() + msg.content.split(" ")[1].slice(1);
        if (
            !channelType || 
            TournamentChannelType[channelType] === undefined || 
            (channelType.toLowerCase() === "announcements" && channel.type !== ChannelType.GuildAnnouncement) || 
            (channelType.toLowerCase() === "mappoolqa" && channel.type !== ChannelType.GuildForum) ||
            (channelType.toLowerCase() === "jobboard" && channel.type !== ChannelType.GuildForum) ||
            (channelType.toLowerCase() !== "announcements" && channelType.toLowerCase() !== "mappoolqa" && channelType.toLowerCase() !== "jobboard" && channel.type !== ChannelType.GuildText)
        ) {
            const reply = await msg.reply(`Invalid channel type ${channelType}.\nAnnouncements should be a guild announcement channel.\nMappool QA and Job Board should be guild forum channels. All other channels should be guild text channels.`);
            setTimeout(async () => {
                reply.delete();
                msg.delete();
            }, 5000);
            return;
        }
        const dupeChannel = tournament.channels!.find(c => c.channelID === channel.id);
        if (dupeChannel) {
            const reply = await msg.reply(`Channel <#${channel.id}> has already been designated for \`${TournamentChannelType[dupeChannel.channelType]}\`.`);
            setTimeout(async () => {
                reply.delete();
                msg.delete();
            }, 5000);
            return;
        }

        const tournamentChannel = new TournamentChannel();
        tournamentChannel.createdBy = creator;
        tournamentChannel.channelID = channel.id;
        tournamentChannel.channelType = TournamentChannelType[channelType];
        tournament.channels!.push(tournamentChannel);

        const tags = forumTags[tournamentChannel.channelType];
        if (tags) {
            const forumChannel = channel as ForumChannel;
            const tagsToAdd = tags.filter(t => !forumChannel!.availableTags.some(at => at.name.toLowerCase() === t.name.toLowerCase()));
            if (tagsToAdd.length > 0)
                await forumChannel.setAvailableTags(tagsToAdd);
        }

        content += `\nChannel <#${channel.id}> designated for \`${channelType}\`.`;
        await channelMessage.edit(content);
        const reply = await msg.reply(`Channel <#${channel.id}> designated for \`${channelType}\`.`);
        setTimeout(async () => {
            reply.delete();
            msg.delete();
        }, 5000);
    });
    channelCollector.on("end", () => timedOut(channelMessage, stopped, "Tournament creation"));
}

// Function to fetch and toggle corsace
async function tournamentCorsace (m: Message, tournament: Tournament) {
    const [stopID, stop] = stopRow();
    const ids = {
        "corsace": randomUUID(),
        "stop": stopID,
    }
    const corsaceRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(ids.corsace)
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
        components: [corsaceRow, stop],
    });
    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === ids.stop) {
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
    componentCollector.on("end", () => timedOut(corsaceMessage, stopped, "Tournament creation"));
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
            { name: "Registration Start Date", value: `<t:${tournament.registrations.start.getTime() / 1000}:F> (<t:${tournament.registrations.start.getTime() / 1000}:R>)`, inline: true },
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
    .setName("tournament_create")
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
        option.setName("players_in_match")
            .setDescription("The amount of players from each team in a given match (4v4 = 4)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(16))
    .addIntegerOption(option =>
        option.setName("min_players")
            .setDescription("The minimum size for a team in the tournament")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(16))
    .addIntegerOption(option =>
        option.setName("max_players")
            .setDescription("The maximum size for a team in the tournament (excl. managers)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(16))
    .addStringOption(option =>
        option.setName("registration_start")
            .setDescription("The registration start date in YYYY-MM-DD (e.g. 2024-01-01) OR unix/epoch (e.g. 1704092400)")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("registration_end")
            .setDescription("The registration end date in YYYY-MM-DD (e.g. 2024-01-02) OR unix/epoch (e.g. 1704178800)")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("team_sort_order")
            .setDescription("The sort order of players/teams in the tournament")
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
    .addUserOption(option =>
        option.setName("organizer")
            .setDescription("Is the tournament organizer someone aside from you? (Blank will assume you are the organizer)")
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

const tournamentCreate: Command = {
    data,
    alternativeNames: ["create_tournament", "tournamentc", "ctournament", "createt", "tcreate", "createtournament", "tournamentcreate", "create-tournament", "tournament-create"],
    category: "tournaments",
    run,
};

export default tournamentCreate;