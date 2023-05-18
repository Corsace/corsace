import { ChatInputCommandInteraction, Message } from "discord.js";
import { Stage } from "../../../Models/tournaments/stage";
import getRounds from "../dbFunctions/getRounds";
import getFromList from "../getFromList";

export default async function getRound (m: Message | ChatInputCommandInteraction, stage: Stage) {
    const rounds = stage.rounds.length > 0 ? stage.rounds : await getRounds(stage.ID, "stageID", false, false);
    if (rounds.length === 0) {
        await m.reply("This stage currently has no rounds. Please create a round first.");
        return;
    }

    const round = await getFromList(m, rounds, "round");
    if (!round)
        return;

    return round;
}