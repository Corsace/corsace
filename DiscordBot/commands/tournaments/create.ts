import { config } from "node-config-ts";
import { ActionRowBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits, SlashCommandBuilder, MessageComponentInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, PermissionsBitField, ButtonBuilder, ButtonStyle, ChannelType, GuildChannelCreateOptions, ForumChannel } from "discord.js";
import { ModeDivision, modeTextToID } from "../../../Models/MCA_AYIM/modeDivision";
import { Tournament, TournamentStatus, sortTextToOrder } from "../../../Models/tournaments/tournament";
import { User } from "../../../Models/user";
import { Command } from "../";
import { loginResponse } from "../../functions/loginResponse";
import { filter, stopRow, timedOut } from "../../functions/messageInteractionFunctions";
import { profanityFilterStrong } from "../../../Interfaces/comment";
import { Stage } from "../../../Models/tournaments/stage";
import { Phase } from "../../../Models/phase";
import { TournamentChannel } from "../../../Models/tournaments/tournamentChannel";
import { TournamentRole } from "../../../Models/tournaments/tournamentRole";
import { randomUUID } from "crypto";
import { discordStringTimestamp, parseDateOrTimestamp } from "../../../Server/utils/dateParse";
import respond from "../../functions/respond";
import commandUser from "../../functions/commandUser";
import getUser from "../../../Server/functions/get/getUser";
import { cron } from "../../../Server/cron";
import { CronJobType } from "../../../Interfaces/cron";
import { StageType } from "../../../Interfaces/stage";
import { TournamentRoleType, TournamentChannelType, getTournamentChannelTypeRoles, forumTags } from "../../../Interfaces/tournament";
import { EmbedBuilder } from "../../functions/embedBuilder";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild || !(m.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator))
        return;
    
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const nameRegex = new RegExp(/-n ([a-zA-Z0-9_ ]{3,50})/);
    const abbreviationRegex = new RegExp(/-a ([a-zA-Z0-9_]{2,8})/);
    const descriptionRegex = new RegExp(/-d ([a-zA-Z0-9_ ]{3,512})/);
    const modeRegex = new RegExp(/-m ([a-zA-Z0-9_ ]{1,14})/);
    const matchupSizeRegex = new RegExp(/-ms ([a-zA-Z0-9_ ]{1,3})/);
    const teamSizeRegex = new RegExp(/-ts (\d+) (\d+)/);
    const registrationRegex = new RegExp(/-r ((?:\d{4}-\d{2}-\d{2})|\d{10}) ((?:\d{4}-\d{2}-\d{2})|\d{10})/);
    const sortOrderRegex = new RegExp(/-s ([a-zA-Z0-9_ ]{1,6})/);
    const helpRegex = new RegExp(/-h/);
    if (m instanceof Message && (helpRegex.test(m.content) || (!nameRegex.test(m.content) && !abbreviationRegex.test(m.content) && !descriptionRegex.test(m.content) && !modeRegex.test(m.content) && !matchupSizeRegex.test(m.content) && !teamSizeRegex.test(m.content) && !registrationRegex.test(m.content) && !sortOrderRegex.test(m.content)))) {
        await m.reply(`Provide all required parameters. Here's a list of them:\n**Name:** \`-n <name>\`\n**Abbreviation:** \`-a <abbreviation>\`\n**Description:** \`-d <description>\`\n**Mode:** \`-m <mode>\`\n**Matchup Size (xvx, input x):** \`-ms <matchup size>\`\n**Team Size:** \`-ts <min> <max>\`\n**Registration Period:** \`-r <start date (YYYY-MM-DD OR unix/epoch)> <end date (YYYY-MM-DD OR unix/epoch)>\`\n**Team Sort Order:** \`-s <sort order>\`\n\nIt's recommended to use slash commands for any \`create\` command.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/)`);
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
        await respond(m, "Dude u can only have 3 tournaments at a time stop making so many tourneys");
        return;
    }

    // Begin tournament creation
    const tournament = new Tournament();
    tournament.server = m.guild.id;
    tournament.stages = [];
    tournament.channels = [];
    tournament.roles = [];
    tournament.status = TournamentStatus.NotStarted;

    // Find server owner and assign them as the tournament organizer
    const creator = await getUser(commandUser(m).id, "discord", false);
    if (!creator) {
        await loginResponse(m);
        return;
    }

    const organizerTarget =  m instanceof Message ? m.mentions.users.first() : m.options.getUser("organizer");
    const organizer = organizerTarget ? await getUser(organizerTarget.id, "discord", false) : creator;
    if (!organizer) {
        // organizerTarget exists in this case because creator cannot be null / undefined.
        await loginResponse(m, "No user found in the corsace database for <@" + organizerTarget!.id + ">! Have them login to the Corsace website with their discord and osu! accounts");
        return;
    }
    tournament.organizer = organizer;

    // Check for name validity
    const name = m instanceof Message ? nameRegex.exec(m.content)?.[1] : m.options.getString("name");
    if (!name) {
        await respond(m, "Provide a valid name for ur tournament!!!!!!! Ur only allowed the following characters: a-z, A-Z, 0-9, _, and spaces. The name must be between 3 and 50 characters long");
        return;
    }
    if (profanityFilterStrong.test(name)) {
        await respond(m, "Ur name is sus . Change it to something more appropriate");
        return;
    }
    tournament.name = name;

    // Check for abbreviation validity
    const abbreviation = m instanceof Message ? abbreviationRegex.exec(m.content)?.[1] : m.options.getString("abbreviation");
    if (!abbreviation) {
        await respond(m, "Provide a valid abbreviation for ur tournament! Ur only allowed the following characters: a-z, A-Z, 0-9, and _. The abbreviation must be between 2 and 8 characters long");
        return;
    }
    if (profanityFilterStrong.test(abbreviation)) {
        await respond(m, "The abbreviation is sus . Change it to something more appropriate");
        return;
    }
    tournament.abbreviation = abbreviation;

    // Check for description validity
    const description = m instanceof Message ? descriptionRegex.exec(m.content)?.[1] : m.options.getString("description");
    if (!description || description.length > 1024 || description.length < 3) {
        await respond(m, "Provide a valid description for ur tournament!!!11!1 Ur only allowed the following characters: a-z, A-Z, 0-9, _, and spaces. The description must be between 3 and 1024 characters long");
        return;
    }
    if (profanityFilterStrong.test(description)) {
        await respond(m, "Write a description that doesn't sound like it was written by a 15 year old");
        return;
    }
    tournament.description = description;

    // Check for mode validity
    const mode = m instanceof Message ? modeRegex.exec(m.content)?.[1] : m.options.getString("mode");
    const modeID = modeTextToID(mode);
    if (modeID === 0) {
        await respond(m, `Provide a valid mode for ur tournament \`${mode}\` is invalid`);
        return;
    }

    const modeDivision = await ModeDivision.findOne({
        where: {
            ID: modeID,
        },
    });
    if (!modeDivision) {
        await respond(m, "That mode doesn't exist");
        return;
    }
    tournament.mode = modeDivision;

    // Check for matchup size validity
    let matchupSize = m instanceof Message ? matchupSizeRegex.exec(m.content)?.[1] : m.options.getInteger("players_in_matchup");
    if (!matchupSize) {
        await respond(m, "Provide a valid matchup size for ur tournament it's currently missing");
        return;
    }
    matchupSize = typeof matchupSize === "string" ? parseInt(matchupSize) : matchupSize;
    if (isNaN(matchupSize) || matchupSize < 1 || matchupSize > 16) {
        await respond(m, "Provide a valid matchup size for ur tournament it's currently invalid");
        return;
    }
    tournament.matchupSize = matchupSize;

    // Check for min and max team size validity
    let minSize: number | null = 0;
    let maxSize: number | null = 0;
    if (m instanceof Message) {
        const teamSize = teamSizeRegex.exec(m.content);
        if (!teamSize) {
            await m.reply("Provide a valid team size for ur tournament");
            return;
        }
        minSize = parseInt(teamSize[1]);
        maxSize = parseInt(teamSize[2]);
    } else {
        minSize = m.options.getInteger("min_players");
        maxSize = m.options.getInteger("max_players");
        if (!minSize || !maxSize) {
            await m.editReply("Provide a valid team size for ur tournament");
            return;
        }
    }
    if (minSize < 1 || minSize > 16 || minSize < tournament.matchupSize || maxSize > 32 || minSize > maxSize) {
        await respond(m, "Provide a valid team size for ur tournament");
        return;
    }
    tournament.minTeamSize = minSize;
    tournament.maxTeamSize = maxSize;

    // Check for registration date validity
    const registrationStartText = m instanceof Message ? registrationRegex.exec(m.content)?.[1] : m.options.getString("registration_start");
    const registrationEndText = m instanceof Message ? registrationRegex.exec(m.content)?.[2] : m.options.getString("registration_end");
    if (!registrationStartText || !registrationEndText) {
        await respond(m, "Provide valid registration dates for ur tournament. The format is `YYYY-MM-DD` or a unix/epoch timestamp in seconds.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/)");
        return;
    }

    const registrationStart = new Date(parseDateOrTimestamp(registrationStartText));
    const registrationEnd = new Date(parseDateOrTimestamp(registrationEndText));
    if (isNaN(registrationStart.getTime()) || isNaN(registrationEnd.getTime()) || registrationStart.getTime() > registrationEnd.getTime() || registrationEnd.getTime() < Date.now()) {
        await respond(m, "Provide valid registration dates for ur tournament and make sure the registration end date is actually after today! The format is `YYYY-MM-DD` or a unix/epoch timestamp in seconds.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/)");
        return;
    }

    tournament.registrations = {} as Phase;
    tournament.registrations.start = registrationStart;
    tournament.registrations.end = registrationEnd;
    tournament.year = registrationEnd.getUTCFullYear();

    if (tournament.registrations.start.getTime() < Date.now())
        tournament.status = TournamentStatus.Registrations;

    // Check for registration sort order validity
    const sortOrder = m instanceof Message ? sortOrderRegex.exec(m.content)?.[1] : m.options.getString("team_sort_order");
    const sortOrderID = sortTextToOrder(sortOrder);
    if (sortOrderID === -1) {
        await respond(m, "Provide a valid sort order for ur tournament");
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

    const message = await respond(m, "Ok let's g o");
    if (qualifiers)
        await tournamentQualifiersPass(message, tournament, creator);
    else
        await tournamentRoles(message, tournament, creator);
}

// Function to retrieve how many teams/players pass qualifiers
async function tournamentQualifiersPass (m: Message, tournament: Tournament, creator: User) {
    const [id, stop] = stopRow();
    const passMessage = await m.reply({
        content: "How many teams are expected to pass qualifiers? (Enter a number >= 2)", 
        components: [stop],
    });
    let stopped = false;
    const componentCollector = m.channel.createMessageComponentCollector({ filter, time: 6000000 });	
    const collector = m.channel.createMessageCollector({ filter, time: 6000000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
        if (i.customId === id) {
            const reply = await i.reply("Tournament creation stopped");
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
            const reply = await msg.reply("Invalid number of teams to pass qualifiers");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }

        tournament.stages[0].initialSize = -1;
        tournament.stages[0].finalSize = parseInt(msg.content);

        stopped = true;
        collector.stop();
        componentCollector.stop();
        const reply = await msg.reply(`${tournament.stages[0].finalSize} teams to pass qualifiers saved`);
        setTimeout(async () => reply.delete(), 5000);
        await tournamentRoles(m, tournament, creator);
    });
    collector.on("end", () => timedOut(passMessage, stopped, "Tournament creation"));
}

// Function to fetch and assign roles
async function tournamentRoles (m: Message, tournament: Tournament, creator: User) {
    tournament.roles = [];

    let stopped = false;
    let content = "Mention/paste a role ID, and then write the designated tournament role it's for (e.g. `1024037229250744411 participants`)\n\nIf u want the bot to create a role for u, select a role type from the dropdown below.\nIf ur done, press the `done` button.\nAny roles with administrator privileges are automatically assigned as `Organizer`\n";

    // Find all roles in the server and assign them as organizer tournament roles
    const roles = m.guild!.roles.cache.filter(r => r.permissions.has(PermissionFlagsBits.Administrator));
    for (const role of roles.toJSON()) {
        const tournamentRole = new TournamentRole();
        tournamentRole.createdBy = creator;
        tournamentRole.roleID = role.id;
        tournamentRole.roleType = TournamentRoleType.Organizer;
        tournament.roles.push(tournamentRole);

        content += `\nDesignated role \`${role.name} (${role.id})\` for \`Organizer\``;
    }

    const ids = {
        "role": randomUUID(),
        "stop": randomUUID(),
        "done": randomUUID(),
    };
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
                                label: "Captains",
                                value: "Captains",
                                description: "Create a team captain role",
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
                            },
                            {
                                label: "Designer",
                                value: "Designer",
                                description: "Create a designer role",
                            },
                            {
                                label: "Developer",
                                value: "Developer",
                                description: "Create a developer role",
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

    const componentCollector = m.channel.createMessageComponentCollector({ filter, time: 6000000 });
    const roleCollector = m.channel.createMessageCollector({ filter, time: 6000000 });

    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (stopped)
            return;

        if (i.customId === ids.stop) {
            await i.reply("Tournament creation stopped");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            roleCollector.stop();
            return;
        }
        if (i.customId === ids.done) {
            await i.reply("Tournament role designation has finished");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            roleCollector.stop();
            await tournamentChannels(m, tournament, creator);
            return;
        }
        if (i.customId === ids.role) {
            const roleString = (i as StringSelectMenuInteraction).values[0];
            const roleType = TournamentRoleType[roleString as keyof typeof TournamentRoleType];
            if (tournament.roles.find(r => r.roleType === roleType)) {
                await i.reply("A role with this type already exists.\n If u wanna create another role with this type, manually create it and then mention it here");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            const role = await m.guild!.roles.create({
                name: `${tournament.name} ${roleString}`,
                reason: `Created by ${m.author.username} for tournament ${tournament.name}`,
                mentionable: true,
            });
            const tournamentRole = new TournamentRole();
            tournamentRole.createdBy = creator;
            tournamentRole.roleID = role.id;
            tournamentRole.roleType = roleType;
            tournament.roles.push(tournamentRole);

            content += `\nCreated role <@&${role.id}> for \`${roleString}\``;
            await roleMessage.edit(content);
            await i.reply(`Created role <@&${role.id}> for \`${roleString}\``);
            setTimeout(async () => (await i.deleteReply()), 5000);
        }
    });

    roleCollector.on("collect", async (msg: Message) => {
        if (stopped)
            return;

        const role = msg.mentions.roles.first() ?? m.guild!.roles.cache.get(msg.content.split(" ")[0]);
        if (!role) {
            const reply = await msg.reply("Invalid role");
            setTimeout(async () => {
                await Promise.all([
                    reply.delete(),
                    msg.delete(),
                ]);
            }, 5000);
            return;
        }
        const roleType = msg.content.split(" ")[1].charAt(0).toUpperCase() + msg.content.split(" ")[1].slice(1);
        if (!(roleType in TournamentRoleType)) {
            const reply = await msg.reply(`Invalid role type ${roleType}`);
            setTimeout(async () => {
                await Promise.all([
                    reply.delete(),
                    msg.delete(),
                ]);
            }, 5000);
            return;
        }
        const dupeRole = tournament.roles.find(r => r.roleID === role.id);
        if (dupeRole) {
            const reply = await msg.reply(`${role.name} (${role.id}) is already designated as \`${TournamentRoleType[dupeRole.roleType]}\``);
            setTimeout(async () => {
                await Promise.all([
                    reply.delete(),
                    msg.delete(),
                ]);
            }, 5000);
            return;
        }
        const tournamentRole = new TournamentRole();
        tournamentRole.createdBy = creator;
        tournamentRole.roleID = role.id;
        tournamentRole.roleType = TournamentRoleType[roleType as keyof typeof TournamentRoleType];
        tournament.roles.push(tournamentRole);

        content += `\nDesignated role \`${role.name} (${role.id})\` for \`${roleType}\``;
        await roleMessage.edit(content);
        const reply = await msg.reply(`Designated role \`${role.name} (${role.id})\` for \`${roleType}\``);
        setTimeout(async () => {
            await Promise.all([
                reply.delete(),
                msg.delete(),
            ]);
        }, 5000);
    });
    roleCollector.on("end", () => timedOut(roleMessage, stopped, "Tournament creation"));
}

// Function to fetch and assign channels
async function tournamentChannels (m: Message, tournament: Tournament, creator: User) {
    let stopped = false;
    let content = "Mention/paste a channel ID, and then write the designated tournament channel type it's for (e.g. `#general general` or `#organizers admin`)\n\nIf u want the bot to create a channel for u, select a channel type from the dropdown below.\nIf ur done, press the `done` button\n\nNote: If you put an announcement channel but no stream announcement channel, it will put the stream announcements in the announcements channel\n";
    const ids = {
        "channel": randomUUID(),
        "stop": randomUUID(),
        "done": randomUUID(),
    };
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
                                label: "Staff",
                                value: "Staff",
                                description: "Create a tournament staff channel",
                            },
                            {
                                label: "Captains",
                                value: "Captains",
                                description: "Create a tournament team captains channel",
                            },
                            {
                                label: "Announcements",
                                value: "Announcements",
                                description: "Create a tournament announcements channel (requires a community server)",
                            },
                            {
                                label: "Stream Announcements",
                                value: "Streamannouncements",
                                description: "Create a tournament stream announcements channel (requires a community server)",
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
                                label: "Rescheduling",
                                value: "Rescheduling",
                                description: "Create a channel to log matchup reschedules",
                            },
                            {
                                label: "Matchup Results",
                                value: "Matchupresults",
                                description: "Create a channel to log tournament matchup results",
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

    const componentCollector = m.channel.createMessageComponentCollector({ filter, time: 6000000 });
    const channelCollector = m.channel.createMessageCollector({ filter, time: 6000000 });

    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === ids.stop) {
            await i.reply("Tournament creation stopped");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            channelCollector.stop();
            return;
        }
        if (i.customId === ids.done) {
            await i.reply("Tournament channel designation has finished");
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
            const tournamentChannelType = TournamentChannelType[channelTypeMenu as keyof typeof TournamentChannelType];
            if (tournament.channels.find(c => c.channelType === tournamentChannelType)) {
                await i.reply("A channel of this type has already been designated. If u wanna create another channel of this type, manually create it and then mention it here");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }

            let channelType = ChannelType.GuildText;
            if (channelTypeMenu === "Announcements" || channelTypeMenu === "Streamannouncements")
                channelType = ChannelType.GuildAnnouncement;
            else if (channelTypeMenu === "Jobboard" || channelTypeMenu === "Mappoolqa")
                channelType = ChannelType.GuildForum;

            const tournamentChannel = new TournamentChannel();
            tournamentChannel.createdBy = creator;
            tournamentChannel.channelType = tournamentChannelType;

            const channelObject: GuildChannelCreateOptions = {
                type: channelType,
                name: `${tournament.abbreviation}-${channelTypeMenu}`,
                topic: `Tournament ${tournament.name} channel for ${channelTypeMenu}`,
                reason: `${tournament.name} channel created by ${m.author.username} for ${(i as StringSelectMenuInteraction).values[0]} purposes.`,
                defaultAutoArchiveDuration: 10080,
            };

            const allowedRoleTypes = getTournamentChannelTypeRoles()[tournamentChannel.channelType];
            if (allowedRoleTypes !== undefined) {
                channelObject.permissionOverwrites = [
                    {
                        id: m.guild!.id, // the ID of the @everyone role is the same as the guild ID
                        deny: PermissionFlagsBits.ViewChannel,
                    },
                ];
                const allowedRoles = tournament.roles.filter(r => allowedRoleTypes.includes(r.roleType));
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
            tournament.channels.push(tournamentChannel);

            content += `\nCreated channel <#${channel.id}> for \`${channelTypeMenu}\``;
            await channelMessage.edit(content);
            await i.reply(`Created channel <#${channel.id}> for \`${channelTypeMenu}\``);
            setTimeout(async () => (await i.deleteReply()), 5000);
        }
    });

    channelCollector.on("collect", async (msg: Message) => {
        if (stopped)
            return;

        const channel = msg.mentions.channels.first() ?? m.guild!.channels.cache.get(msg.content.split(" ")[0]);
        if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement && channel.type !== ChannelType.GuildForum)) {
            const reply = await msg.reply("Invalid channel");
            setTimeout(async () => {
                await Promise.all([
                    reply.delete(),
                    msg.delete(),
                ]);
            }, 5000);
            return;
        }
        const channelType = msg.content.split(" ")[1].charAt(0).toUpperCase() + msg.content.split(" ")[1].slice(1);
        if (
            !channelType || 
            !(channelType in TournamentChannelType) || 
            (channelType.toLowerCase() === "announcements" && channelType.toLowerCase() === "streamannouncements" && channel.type !== ChannelType.GuildAnnouncement) || 
            (channelType.toLowerCase() === "mappoolqa" && channel.type !== ChannelType.GuildForum) ||
            (channelType.toLowerCase() === "jobboard" && channel.type !== ChannelType.GuildForum) ||
            (channelType.toLowerCase() !== "announcements" && channelType.toLowerCase() !== "streamannouncements" && channelType.toLowerCase() !== "mappoolqa" && channelType.toLowerCase() !== "jobboard" && channel.type !== ChannelType.GuildText)
        ) {
            const reply = await msg.reply(`Invalid channel type ${channelType}.\nAnnouncements should be a guild announcement channel\nMappool QA and Job Board should be guild forum channels\nAll other channels should be guild text channels`);
            setTimeout(async () => {
                await Promise.all([
                    reply.delete(),
                    msg.delete(),
                ]);
            }, 5000);
            return;
        }
        const dupeChannel = tournament.channels.find(c => c.channelID === channel.id);
        if (dupeChannel) {
            const reply = await msg.reply(`Channel <#${channel.id}> has already been designated for \`${TournamentChannelType[dupeChannel.channelType]}\``);
            setTimeout(async () => {
                await Promise.all([
                    reply.delete(),
                    msg.delete(),
                ]);
            }, 5000);
            return;
        }

        const tournamentChannel = new TournamentChannel();
        tournamentChannel.createdBy = creator;
        tournamentChannel.channelID = channel.id;
        tournamentChannel.channelType = TournamentChannelType[channelType as keyof typeof TournamentChannelType];
        tournament.channels.push(tournamentChannel);

        const tags = forumTags()[tournamentChannel.channelType];
        if (tags) {
            const forumChannel = channel as ForumChannel;
            const tagsToAdd = tags.map(tag => {
                const forumTag = forumChannel.availableTags.find(t => t.name.toLowerCase() === tag.name.toLowerCase());
                if (forumTag)
                    return forumTag;
                return tag;
            });
            await forumChannel.setAvailableTags(tagsToAdd);
        }

        content += `\nChannel <#${channel.id}> designated for \`${channelType}\``;
        await channelMessage.edit(content);
        const reply = await msg.reply(`Channel <#${channel.id}> designated for \`${channelType}\``);
        setTimeout(async () => {
            await Promise.all([
                reply.delete(),
                msg.delete(),
            ]); 
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
    };
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
    const componentCollector = m.channel.createMessageComponentCollector({ filter, time: 6000000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === ids.stop) {
            stopped = true;
            componentCollector.stop();
            await i.reply("Tournament creation stopped");
            setTimeout(async () => (await i.deleteReply()), 5000);
            return;
        }
        const corsaceType = (i as StringSelectMenuInteraction).values[0];
        tournament.isOpen = corsaceType === "open";
        tournament.isClosed = tournament.invitational = corsaceType === "closed";

        stopped = true;
        componentCollector.stop();
        await i.reply("Corsace option of `" + corsaceType + "` saved");
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
    await Promise.all(tournament.channels.map(async c => {
        c.tournament = tournament;
        return c.save();
    }));
    await Promise.all(tournament.roles.map(async r => {
        r.tournament = tournament;
        return r.save();
    }));
    await cron.add(CronJobType.TournamentRegistrationEnd, tournament.registrations.end);
    if (tournament.registrations.start.getTime() > Date.now())
        await cron.add(CronJobType.TournamentRegistrationStart, tournament.registrations.start);

    const embed = new EmbedBuilder()
        .setTitle(tournament.name)
        .setDescription(tournament.description)
        .addFields(
            { name: "Mode", value: tournament.mode.name, inline: true },
            { name: "Matchup Size", value: tournament.matchupSize.toString(), inline: true },
            { name: "Allowed Team Size", value: `${tournament.minTeamSize} - ${tournament.maxTeamSize}`, inline: true },
            { name: "Registration Start Date", value: discordStringTimestamp(tournament.registrations.start), inline: true },
            { name: "Qualifiers", value: tournament.stages.some(q => q.stageType === StageType.Qualifiers).toString(), inline: true },
            { name: "Invitational", value: tournament.invitational ? "Yes" : "No", inline: true },
            { name: "Server", value: tournament.server, inline: true }
        )
        .setTimestamp()
        .setAuthor({ name: m.author.username, icon_url: m.member?.avatarURL() ?? undefined });

    if (tournament.isOpen || tournament.isClosed)
        embed.addFields(
            { name: "Corsace", value: tournament.isOpen ? "Open" : "Closed", inline: true }
        );

    await respond(m, "Nice u saved the tournament!!!1\nHere's the tournament embed:", embed);
}

const data = new SlashCommandBuilder()
    .setName("tournament_create")
    .setDescription("Create a tournament")
    .addStringOption(option =>
        option.setName("name")
            .setDescription("The name of the tournament")
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(50))
    .addStringOption(option =>
        option.setName("abbreviation")
            .setDescription("The short form of the tournament name. Example: `Corsace Open 2021` -> `CO21`")
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(8))
    .addStringOption(option =>
        option.setName("description")
            .setDescription("The description of the tournament")
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(1024))
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
        option.setName("players_in_matchup")
            .setDescription("The amount of players from each team in a given matchup (4v4 = 4)")
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
            .setDescription("The maximum size for a team in the tournament (excl. captains if captain_must_play is false)")
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
    .addBooleanOption(option =>
        option.setName("captain_must_play")
            .setDescription("Can the captain be a non-player? (If yes, not counted in min/max team size)")
            .setRequired(true))
    .addUserOption(option =>
        option.setName("organizer")
            .setDescription("Is the tournament organizer someone aside from you? (Blank will assume you are the organizer)")
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

const tournamentCreate: Command = {
    data,
    alternativeNames: [ "create_tournament", "tournamentc", "ctournament", "createt", "tcreate", "createtournament", "tournamentcreate", "create-tournament", "tournament-create", "tournamentsc", "ctournaments" ],
    category: "tournaments",
    run,
};

export default tournamentCreate;