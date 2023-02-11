import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, MessageComponentInteraction } from "discord.js";
import { Stage } from "../../Models/tournaments/stage";
import { Tournament } from "../../Models/tournaments/tournament";
import { filter, stopRow } from "./messageInteractionFunctions";

// Function to fetch the tournament to create a stage for
export async function fetchTournament (m: Message, serverTournaments: Tournament[]): Promise<Tournament | undefined> {
    if (serverTournaments.length === 1)
        return serverTournaments[0];

    let row = new ActionRowBuilder<ButtonBuilder>();
    for (const tournament of serverTournaments) {
        row = row.addComponents(
            new ButtonBuilder()
                .setCustomId(tournament.ID.toString())
                .setLabel(tournament.name)
                .setStyle(ButtonStyle.Primary)
        );
    }

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
            const tournament = serverTournaments.find(t => t.ID.toString() === i.customId);
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
export async function fetchStage (m: Message, tournament: Tournament): Promise<Stage | undefined> {
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