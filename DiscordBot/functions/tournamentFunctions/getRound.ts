import { ChatInputCommandInteraction, Message } from "discord.js";
import { Stage } from "../../../Models/tournaments/stage";
import getRounds from "../../../Server/functions/get/getRounds";
import getFromList from "../getFromList";

export default async function getRound (m: Message | ChatInputCommandInteraction, stage: Stage) {
    const rounds = stage.rounds.length > 0 ? stage.rounds : await getRounds(stage.ID, "stageID", false, false);
    if (rounds.length === 0) {
        await m.reply("This stage has NO rounds . Create a round first if ur one of the admins of the tournament");
        return;
    }

    const round = await getFromList(m, rounds, "round", stage.name);
    if (!round)
        return;

    return round;
}