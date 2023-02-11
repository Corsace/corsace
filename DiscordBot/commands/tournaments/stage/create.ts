import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Message, MessageComponentInteraction, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { Command } from "../..";
import { Round } from "../../../../Models/tournaments/round";
import { ScoringMethod, Stage, StageType } from "../../../../Models/tournaments/stage";
import { Tournament, TournamentStatus } from "../../../../Models/tournaments/tournament";
import { fetchTournament } from "../../../functions/fetchTournament";
import { filter, stopRow } from "../../../functions/messageInteractionFunctions";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild || !(m.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator))
        return;
    
    // Check if the server has any running tournaments
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
        relations: ["stages"],
    });
    if (serverTournaments.length === 0) {
        await m.reply("This server currently has no tournaments running.");
        return;
    }

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const message = await m.channel!.send("Alright let's get started!");

    const tournament = await fetchTournament(message, serverTournaments);
    if (!tournament)
        return;

    const stage = new Stage();
    stage.tournament = tournament;
    await stageName(message, stage);

    if (m instanceof ChatInputCommandInteraction)
        await m.deleteReply();
}

// Function to fetch the name of the stage
async function stageName (m: Message, stage: Stage) {
    const nameMessage = await m.channel!.send({
        content: "What do you want to name the stage?",
        components: [stopRow],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === "stop") {
            await i.reply("Tournament creation stopped.");
            await nameMessage.delete();
            stopped = true;
            return;
        }
    });
    const messageCollector = m.channel!.createMessageCollector({ filter, time: 600000 });
    messageCollector.on("collect", async (msg: Message) => {
        if (stopped)
            return;

        if (msg.content.length > 50) {
            const reply = await msg.reply("Stage name too long. Please keep it under 50 characters.");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }

        if (stage.tournament.stages.find(s => s.name.toLowerCase() === msg.content.toLowerCase())) {
            const reply = await msg.reply("A stage with that name already exists.");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }

        stage.name = msg.content;

        stopped = true;
        messageCollector.stop();
        const reply = await msg.reply("Tournament description `" + msg.content + "` saved.\n");
        setTimeout(async () => reply.delete(), 5000);
        await stageTimespan(m, stage);
    });
    messageCollector.on("end", async () => {
        await nameMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
} 

// Function to fetch the timespan of the stage
async function stageTimespan (m: Message, stage: Stage) {
    const timespanMessage = await m.channel!.send({
        content: "Provide 2 dates for the stage's start and end dates.\n\n(e.g. `2023-12-30 2023-12-31`)",
        components: [stopRow],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === "stop") {
            await i.reply("Tournament creation stopped.");
            await timespanMessage.delete();
            stopped = true;
            return;
        }
    });
    const messageCollector = m.channel!.createMessageCollector({ filter, time: 600000 });
    messageCollector.on("collect", async (msg: Message) => {
        if (stopped)
            return;
        const timespan = msg.content.split(" ");
        if (timespan.length !== 2) {
            const reply = await msg.reply("Invalid timespan. Please provide 2 dates.\n\n(e.g. `2021-01-01 2021-01-02`)");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }
        const start = new Date(timespan[0]);
        const end = new Date(timespan[1]);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start.getTime() > end.getTime()) {
            const reply = await msg.reply("Invalid timespan. Please provide 2 dates in consecutive order.\n\n(e.g. `2021-01-01 2021-01-02`)");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }

        // Check if it's after the tournmament registration end date
        if (start.getTime() < stage.tournament.registrations.end.getTime()) {
            const reply = await msg.reply("The stage's timespan is before the tournament's registration end date.");
            setTimeout(async () => reply.delete(), 5000);
            return;
        }

        // Check if there's no overlap with other stages
        let order = 1;
        for (const s of stage.tournament.stages) {
            if (
                (start.getTime() > s.timespan.start.getTime() && start.getTime() < s.timespan.end.getTime()) ||
                (end.getTime() > s.timespan.start.getTime() && end.getTime() < s.timespan.end.getTime()) ||
                start.getTime() === s.timespan.start.getTime() ||
                end.getTime() === s.timespan.end.getTime()
            ) {
                const reply = await msg.reply("The stage's timespan overlaps with another stage.");
                setTimeout(async () => reply.delete(), 5000);
                return;
            }

            // If the timestamp is after the stage's start, the order is increased, if the timestamp is after the stage's end, break the loop
            if (s.timespan.start.getTime() < start.getTime())
                order++;
            else if (s.timespan.end.getTime() > start.getTime())
                break;
        }

        stage.order = order;
        stage.timespan = {
            start,
            end,
        };

        stopped = true;
        messageCollector.stop();
        const reply = await msg.reply("Stage timespan saved.\n");
        setTimeout(async () => reply.delete(), 5000);
        await stageType(m, stage);
    });
    messageCollector.on("end", async () => {
        await timespanMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to fetch the type of the stage
async function stageType (m: Message, stage: Stage) {
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("SingleElimination")
                .setLabel("Single Elimination")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("DoubleElimination")
                .setLabel("Double Elimination")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("RoundRobin")
                .setLabel("Round Robin")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("Swiss")
                .setLabel("Swiss")
                .setStyle(ButtonStyle.Primary)
        );

    const message = await m.channel!.send({
        content: "What type of stage do you want to create?",
        components: [row, stopRow],
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
        stage.stageType = StageType[i.customId];

        stopped = true;
        componentCollector.stop();
        await i.reply("Stage type `" + i.customId + "` saved.\n");
        setTimeout(async () => (await i.deleteReply()), 5000);
        await stageScoring(m, stage);
    });
    componentCollector.on("end", async () => {
        await message.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to fetch which scoring method the stage will use
async function stageScoring (m: Message, stage: Stage) {
    const row = [new ActionRowBuilder<ButtonBuilder>()];
    let i = 0;
    for (const scoreMethod in ScoringMethod) {
        if (isNaN(Number(scoreMethod)))
            row[i].addComponents(
                new ButtonBuilder()
                    .setCustomId(scoreMethod)
                    .setLabel(scoreMethod)
                    .setStyle(ButtonStyle.Primary)
            );
        if (row[i].components.length === 5) {
            i++;
            row.push(new ActionRowBuilder<ButtonBuilder>());
        }
    }

    const message = await m.channel!.send({
        content: "What scoring method does this stage use?",
        components: [...row, stopRow], 
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
        stage.scoringMethod = ScoringMethod[i.customId];

        stopped = true;
        componentCollector.stop();
        await i.reply("Stage type `" + i.customId + "` saved.\n");
        setTimeout(async () => (await i.deleteReply()), 5000);
        await stageTeamCount(m, stage);
    });
    componentCollector.on("end", async () => {
        await message.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to determine the initial and final number of teams for the stage
async function stageTeamCount (m: Message, stage: Stage) {
    const teamCountMessage = await m.channel!.send({
        content: "What are the initial and final number of teams for this stage?\n\n(e.g. 16 8)",
        components: [stopRow],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 600000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === "stop") {
            await i.reply("Tournament creation stopped.");
            await teamCountMessage.delete();
            stopped = true;
            return;
        }
    });
    const teamCountCollector = m.channel!.createMessageCollector({ filter, time: 600000 });
    teamCountCollector.on("collect", async (m: Message) => {
        const teamCount = m.content.split(" ");
        if (teamCount.length !== 2) {
            const reply = await m.channel!.send("Invalid number of teams.");
            setTimeout(async () => (await reply.delete()), 5000);
            return;
        }

        if (isNaN(Number(teamCount[0])) || isNaN(Number(teamCount[1])) || Number(teamCount[0]) <= Number(teamCount[1]) ) {
            const reply = await m.channel!.send("Invalid number of teams.\nInitial number must be greater than or equal to final number.");
            setTimeout(async () => (await reply.delete()), 5000);
            return;
        }

        stage.initialSize = Number(teamCount[0]);
        stage.finalSize = Number(teamCount[1]);

        stopped = true;
        teamCountCollector.stop();
        const reply = await m.reply("Stage team count saved.\n");
        setTimeout(async () => (await reply.delete()), 5000);
        if (stage.stageType === StageType.SingleElimination || stage.stageType === StageType.DoubleElimination)
            await stageBrackets(m, stage);
        else
            await stageDone(m, stage);
    });
    teamCountCollector.on("end", async () => {
        await teamCountMessage.delete();
        if (!stopped)
            await m.reply("Tournament creation timed out.");
    });
}

// Function to generate rounds for elimination stages and determine the number of brackets
async function stageBrackets (m: Message, stage: Stage) {
    // Generate rounds named Round of x where x is the number of teams in the round excluding Quarterfinals onwards
    // If the initial value is not a power of 2, the first round is a play-in and will jump to the closest power of 2
    const rounds: Round[] = [];
    let roundSize = stage.initialSize;
    let roundName = "Round of " + roundSize;
    if (!Number.isInteger(Math.log2(roundSize))) {
        roundSize = Math.pow(2, Math.ceil(Math.log2(roundSize)));
        roundName = "Play-in";
    }
    while (roundSize > stage.finalSize) {
        const round = new Round();
        round.name = roundName;
        round.stage = stage;
        rounds.push(round);

        roundSize /= 2;
        roundName = "Round of " + roundSize;
    }


    await stageDone(m, stage);
}

// Function to finish the stage creation
async function stageDone (m: Message, stage: Stage) {
    const tournament = stage.tournament;
    await tournament.save();
    stage.tournament = tournament;
    await stage.save();

    // Move later stages up in order
    const laterStages = tournament.stages.filter((s) => s.order >= stage.order);
    for (const s of laterStages) {
        if (s.order === stage.order && s.timespan.start < stage.timespan.start)
            continue;
        s.order++;
        await s.save();
    }

    await m.reply("Congratulations on saving your new stage for your tournament! :tada:\nHere is the stage embed:");
    const embed = new EmbedBuilder()
        .setTitle(stage.name)
        .setDescription(stage.timespan.start.toDateString() + " - " + stage.timespan.end.toDateString())
        .addFields(
            { name: "Stage ID", value: stage.ID.toString(), inline: true },
            { name: "Stage Type", value: stage.stageType.toString(), inline: true },
            { name: "Tournament", value: stage.tournament.name, inline: true },
            { name: "Scoring Method", value: stage.scoringMethod.toString(), inline: true },
            { name: "Initial → Final Team Count", value: stage.initialSize + " → " + stage.finalSize, inline: true },
            { name: "Stage Position", value: stage.order.toString(), inline: true }
        )
        .setTimestamp(new Date)
        .setAuthor({ name: m.author.tag, iconURL: m.author.avatarURL() ?? undefined });

    await m.channel!.send({ embeds: [embed] });
}

const data = new SlashCommandBuilder()
    .setName("create_stage")
    .setDescription("Create a stage for a tournament.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

const stageCreate: Command = {
    data,
    category: "tournaments",
    run,
};
    
export default stageCreate;