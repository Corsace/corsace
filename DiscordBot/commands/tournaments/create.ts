import { config } from "node-config-ts";
import { ActionRowBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits, SlashCommandBuilder, MessageComponentInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, EmbedBuilder, PermissionsBitField } from "discord.js";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { SortOrder, Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";
import { User } from "../../../Models/user";
import { Command } from "../index";
import { loginRow } from "../../functions/loginResponse";
import { Stage, StageType } from "../../../Models/tournaments/stage";
import { Phase } from "../../../Models/phase";
import { filter, stopRow } from "../../functions/messageInteractionFunctions";

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
    if (serverTournaments.length === 5) {
        await m.reply("You can only have 5 tournaments at a time!");
        return;
    }

    // Check for name validity
    const nameRegex = new RegExp(/-n [a-zA-Z0-9_ ]{3,32}$/);
    const name = m instanceof Message ? nameRegex.exec(m.content)?.[0] : m.options.getString("name");
    if (!name) {
        await m.reply("Please provide a valid name for your tournament! You are only allowed the following characters: a-z, A-Z, 0-9, _, and spaces. The name must be between 3 and 32 characters long.");
        return;
    }

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

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    // Begin tournament creation
    const tournament = new Tournament();
    tournament.year = (new Date).getUTCFullYear();
    tournament.name = name;
    tournament.server = m.guild.id;
    tournament.organizer = organizer;

    // Ask for a tournament description, callbacks continue within functions
    const message = await m.channel!.send("Alright let's get started!");
    await tournamentDescription(message, tournament);
    if (m instanceof ChatInputCommandInteraction)
        await m.deleteReply();
}

// Function to fetch and add a tournament description
async function tournamentDescription (m: Message, tournament: Tournament) {
    const descMessage = await m.reply({
        content: "You will be able to edit properties not related to channel designations later. Please note that **ONLY SERVER ADMINS** can create a tournament in the server.\n\nWhat is the description of your tournament?",
        components: [stopRow],
    });

    let stopped = false;
    const filter = (msg: Message | MessageComponentInteraction) => {
        if (msg instanceof Message)
            return msg.member!.permissions.has(PermissionFlagsBits.Administrator) && msg.content.length >= 3 && msg.content.length <= 512;
        return (msg.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator);
    };
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === "stop") {
            await i.reply("Tournament creation stopped.");
            await descMessage.delete();
            stopped = true;
            return;
        }
    });

    const collector = m.channel!.createMessageCollector({ filter, time: 600000 });
    collector.on("collect", async (msg: Message) => {
        if (stopped)
            return;
        tournament.description = msg.content;

        stopped = true;
        const reply = await msg.reply("Tournament description `" + msg.content + "` saved.\n");
        setTimeout(async () => reply.delete(), 5000);
        await tournamentMode(m, tournament);
    });
    collector.on("end", async () => {
        await descMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to fetch and add a tournament mode
async function tournamentMode (m: Message, tournament: Tournament) {
    const modeRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("select")
                .setPlaceholder("Select a mode")
                .addOptions(
                    {
                        label: "Standard",
                        value: "1",
                    },
                    {
                        label: "Taiko",
                        value: "2",
                    },
                    {
                        label: "Catch the Beat",
                        value: "3",
                    },
                    {
                        label: "Mania",
                        value: "4",
                    }
                )
        );
    const modeMessage = await m.reply({
        content: "What mode is your tournament?",
        components: [modeRow, stopRow],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === "stop") {
            await i.reply("Tournament creation stopped.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            return;
        }
        const modeID = parseInt((i as StringSelectMenuInteraction).values[0], 10);
        const mode = await ModeDivision.findOne({ where: { ID: modeID }});
        if (!mode) {
            await i.reply("Invalid mode.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            return;
        }
        tournament.mode = mode;

        stopped = true;
        componentCollector.stop();
        await i.reply("Tournament mode `" + mode.name + "` saved.\n");
        setTimeout(async () => (await i.deleteReply()), 5000);
        await tournamentMatchSize(m, tournament);
    });
    componentCollector.on("end", async () => {
        await modeMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}
        
// Function to fetch and add a tournament match size
async function tournamentMatchSize (m: Message, tournament: Tournament) {
    const sizeRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("select")
                .setPlaceholder("Select a match size")
                .addOptions(
                    {
                        label: "1v1",
                        value: "1",
                    },
                    {
                        label: "2v2",
                        value: "2",
                    },
                    {
                        label: "3v3",
                        value: "3",
                    },
                    {
                        label: "4v4",
                        value: "4",
                    },
                    {
                        label: "5v5",
                        value: "5",
                    },
                    {
                        label: "6v6",
                        value: "6",
                    },
                    {
                        label: "7v7",
                        value: "7",
                    },
                    {
                        label: "8v8",
                        value: "8",
                    }
                )
        );
    const sizeMessage = await m.reply({
        content: "What match size is your tournament?",
        components: [sizeRow, stopRow],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === "stop") {
            await i.reply("Tournament creation stopped.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            return;
        }
        const sizeID = parseInt((i as StringSelectMenuInteraction).values[0], 10);
        if (sizeID < 1 || sizeID > 8) {
            await i.reply("Invalid match size.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            return;
        }
        tournament.matchSize = sizeID;

        stopped = true;
        componentCollector.stop();
        await i.reply("Tournament match size `" + sizeID + "v" + sizeID + "` saved.\n");
        setTimeout(async () => (await i.deleteReply()), 5000);
        await tournamentTeamSize(m, tournament);
    });
    componentCollector.on("end", async () => {
        await sizeMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to fetch and add a tournament team size
async function tournamentTeamSize (m: Message, tournament: Tournament) {
    const sizeMessage = await m.reply({
        content: "Provide 2 numbers for required team sizes. One for the minimum team size, and one for the maximum team size.\nMin size should be less than 8, and greater than match size.\nMax size should be less than 32 and greater than min size.\n\n(e.g. `1 1` or `6 8`)",
        components: [stopRow],
    });
    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });	
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === "stop") {
            await i.reply("Tournament creation stopped.");
            await sizeMessage.delete();
            stopped = true;
            return;
        }
    });
    const collector = m.channel!.createMessageCollector({ filter, time: 600000 });
    collector.on("collect", async (msg: Message) => {
        if (stopped) 
            return;

        const size = msg.content.split(" ");
        if (size.length !== 2) {
            const reply = await msg.reply("Please only provide 2 numerical values.");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }
        const min = parseInt(size[0], 10);
        const max = parseInt(size[1], 10);
        if (isNaN(min) || isNaN(max) || min < 1 || max < 1 || min > max || min < tournament.matchSize || min > 8 || max > 32) {
            const reply = await msg.reply("Invalid team size values.\n\nPlease provide the minimum team size first, then the maximum team size.\nPlease make sure the minimum team size is less than or equal to the maximum team size.\nPlease make sure the minimum team size is larger than or equal to the match size.\nPlease make sure the minimum team size is less than or equal to 8.\nPlease make sure the maximum team size is less than or equal to 32.");
            setTimeout(async () => reply.delete(), 15000);
            return;
        }
        tournament.minTeamSize = min;
        tournament.maxTeamSize = max;

        stopped = true;
        collector.stop();
        const reply = await msg.reply("Team sizes between `" + min + " - " + max + "` saved.\n");
        setTimeout(async () => reply.delete(), 5000);
        await tournamentRegistrationDates(m, tournament);
    });
    collector.on("end", async () => {
        await sizeMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to fetch and add registration start and end dates
async function tournamentRegistrationDates (m: Message, tournament: Tournament) {
    const dateMessage = await m.reply({
        content: "Provide 2 dates for registration start and end dates.\n\n(e.g. `2023-12-30 2023-12-31`)",
        components: [stopRow],
    });
    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });	
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
        if (i.customId === "stop") {	
            await i.reply("Tournament creation stopped.");	
            await dateMessage.delete();	
            stopped = true;	
            return;	
        }	
    });
    const collector = m.channel!.createMessageCollector({ filter, time: 600000 });
    collector.on("collect", async (msg: Message) => {
        if (stopped) 
            return;

        const dates = msg.content.split(" ");
        if (dates.length !== 2) {
            const reply = await msg.reply("Please only provide 2 dates.");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }
        const start = new Date(dates[0]);
        const end = new Date(dates[1]);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start.getTime() > end.getTime() || end.getTime() < Date.now()) {
            const reply = await msg.reply("Invalid date values.\n\nPlease provide the registration start date first, then the registration end date.\nPlease make sure the registration start date is less than or equal to the registration end date.\nPlease make sure the registration end date is greater than or equal to the current date.");
            setTimeout(async () => reply.delete(), 15000);
            return;
        }
        tournament.registrations = {} as Phase;
        tournament.registrations.start = start;
        tournament.registrations.end = end;

        if (start.getTime() < Date.now())
            tournament.status = TournamentStatus.Registrations;

        stopped = true;
        collector.stop();
        const reply = await msg.reply("Registration start and end dates saved.\n");
        setTimeout(async () => reply.delete(), 5000);
        await tournamentSortOrder(m, tournament);
    });
    collector.on("end", async () => {
        await dateMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to fetch and add a tournament sort order
async function tournamentSortOrder (m: Message, tournament: Tournament) {
    const sortOrderRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("sort_order")
                .setPlaceholder("Select a registration sort order")
                .addOptions(
                    {
                        label: "Signup Order",
                        value: "Signup",
                        description: "Order by signup time",
                    },
                    {
                        label: "Random",
                        value: "Random",
                        description: "Randomized order",
                    },
                    {
                        label: "Rank/PP",
                        value: "RankPP",
                        description: "Order by rank/PP",
                    },
                    {
                        label: "BWS Rank",
                        value: "BWS",
                        description: "Order by BWS rank",
                    }
                )
        );
    const sortOrderMessage = await m.reply({
        content: "How should teams/players be sorted in registration?",
        components: [sortOrderRow, stopRow],
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
        const orderType = (i as StringSelectMenuInteraction).values[0];
        if (orderType === "Signup" || orderType === "Random" || orderType === "RankPP" || orderType === "BWS")
            tournament.regSortOrder = SortOrder[orderType];
        else {
            await i.reply("Invalid sort order.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            return;
        }
        
        stopped = true;
        componentCollector.stop();
        await i.reply("Sort order of `" + SortOrder[orderType] + "` saved.\n");
        setTimeout(async () => (await i.deleteReply()), 5000);
        await tournamentQualifiers(m, tournament);
    });
    componentCollector.on("end", async () => {
        await sortOrderMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to fetch and toggle qualifiers
async function tournamentQualifiers (m: Message, tournament: Tournament) {
    const qualifiersRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("qualifiers")
                .setPlaceholder("Select a qualifier option")
                .addOptions(
                    {
                        label: "No Qualifiers",
                        value: "No",
                        description: "No qualifiers",
                    },
                    {
                        label: "Qualifiers",
                        value: "Yes",
                        description: "There will be qualifiers",
                    }
                )
        );
    const qualifiersMessage = await m.reply({
        content: "Will there be qualifiers?",
        components: [qualifiersRow, stopRow],
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
        const qualifierType = (i as StringSelectMenuInteraction).values[0];
        if (qualifierType === "Yes") {
            const qualifiers = new Stage();
            qualifiers.name = "Qualifiers";
            qualifiers.order = 1;
            qualifiers.stageType = StageType.Qualifiers;
            qualifiers.timespan = {
                start: new Date(tournament.registrations.end.getTime() + 14 * 24 * 60 * 60 * 1000),
                end: new Date(tournament.registrations.end.getTime() + 21 * 24 * 60 * 60 * 1000),
            };
            tournament.stages = [qualifiers];
        } else if (qualifierType === "No") {
            tournament.stages = [];
        } else {
            await i.reply("Invalid qualifier option.");
            setTimeout(async () => (await i.deleteReply()), 5000);
            return;
        }

        stopped = true;
        componentCollector.stop();
        await i.reply("Qualifier option of `" + qualifierType + "` saved.\n");
        setTimeout(async () => (await i.deleteReply()), 5000);
        if (qualifierType === "Yes")
            await tournamentQualifiersPass(m, tournament);
        else if (m.guild!.id === config.discord.guild)
            await tournamentCorsace(m, tournament);
        else
            await tournamentSave(m, tournament);
    });
    componentCollector.on("end", async () => {
        await qualifiersMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to retrieve how many teams/players pass qualifiers
async function tournamentQualifiersPass (m: Message, tournament: Tournament) {
    const passMessage = await m.reply({
        content: "How many teams are expected to pass qualifiers? (Please enter a number >= 2)", 
        components: [stopRow],
    });
    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });	
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
        if (i.customId === "stop") {	
            await i.reply("Tournament creation stopped.");	
            await passMessage.delete();	
            stopped = true;	
            return;	
        }	
    });
    const collector = m.channel!.createMessageCollector({ filter, time: 600000 });
    collector.on("collect", async (msg: Message) => {
        if (stopped) 
            return;

        const size = parseInt(msg.content, 10);
        if (isNaN(size) || size < 2) {
            await msg.reply("Invalid number.");
            setTimeout(async () => (await msg.delete()), 5000);
            return;
        }
        tournament.stages![0].finalSize = size;

        stopped = true;
        collector.stop();
        const reply = await msg.reply("Number of teams to pass qualifiers `" + size + "` saved.\n");
        setTimeout(async () => reply.delete(), 5000);
        if (m.guild!.id === config.discord.guild)
            await tournamentCorsace(m, tournament);
        else
            await tournamentSave(m, tournament);
    });
    collector.on("end", async () => {
        await passMessage.delete();
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
    await tournament.stages.map(async s => {
        s.tournament = tournament;
        await s.save();
    });
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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

const tournamentCreate: Command = {
    data,
    category: "tournaments",
    run,
};

export default tournamentCreate;