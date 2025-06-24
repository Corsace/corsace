import { randomUUID } from "crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message, MessageComponentInteraction, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { Command } from "../..";
import { Round } from "../../../../Models/tournaments/round";
import { filter, timedOut } from "../../../functions/messageInteractionFunctions";
import { loginResponse } from "../../../functions/loginResponse";
import channelID from "../../../functions/channelID";
import commandUser from "../../../functions/commandUser";
import confirmCommand from "../../../functions/confirmCommand";
import getRound from "../../../functions/tournamentFunctions/getRound";
import getStage from "../../../functions/tournamentFunctions/getStage";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import getUser from "../../../../Server/functions/get/getUser";
import respond from "../../../functions/respond";
import { discordStringTimestamp } from "../../../../Server/utils/dateParse";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild || !(m.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator))
        return;

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const tournament = await getTournament(m, channelID(m), "channel", undefined, true);
    if (!tournament)
        return;

    const stage = await getStage(m, tournament, false, tournament.ID, "tournamentID");
    if (!stage)
        return;

    // If the stage is an elimination-type stage, then check if they want to make a map order for a specific round for the stage; otherwise, just make do it for the stage
    let round: Round | undefined = undefined;
    if (
        stage.rounds.length > 0 &&
        await confirmCommand(m, `Is this for a specific round in ${stage.abbreviation}?\n**If it's for the entire stage, select No**`)
    )
        round = await getRound(m, stage);

    const ids = {
        stop: randomUUID(),
        null: randomUUID(),
    };
    const { schedulingDeadline } = stage ?? round;
    const inputDateMessage = await m.channel!.send({
        content: `The current scheduling deadline is ${schedulingDeadline ? discordStringTimestamp(schedulingDeadline) : "unset"}. Please type the desired scheduling deadline using either \`YYYY-MM-DD HH:mm\` format, or a unix/epoch timestamp in seconds.`,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(ids.stop)
                        .setLabel("STOP COMMAND")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(ids.null)
                        .setLabel("REMOVE DEADLINE")
                        .setStyle(ButtonStyle.Success)
                ),
        ],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    const inputDateCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });

    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId === ids.stop) {
            await i.reply("Ok");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            inputDateCollector.stop();
            await respond(m, "Scheduling deadline change cancelled");
            return;
        }
        if (i.customId === ids.null) {
            (round ?? stage).schedulingDeadline = null;
            await (round ?? stage).save();
            await i.reply("Done");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            inputDateCollector.stop();
            await respond(m, `Scheduling deadline for ${round ? `round ${round.abbreviation}` : `stage ${stage.abbreviation}`} removed`);
            return;
        }
    });
    inputDateCollector.on("collect", async (msg: Message) => {
        const input = msg.content.trim();
        const date = new Date(/^\d+$/.test(input) ? parseInt(input) * 1000 : input);

        if (isNaN(date.getTime())) {
            await respond(m, "Invalid date format. Please use `YYYY-MM-DD HH:mm` or a unix timestamp in seconds.");
            return;
        }

        (round ?? stage).schedulingDeadline = date;
        await (round ?? stage).save();

        const confirmation = await m.channel!.send("Ok");
        setTimeout(async () => (await confirmation.delete()), 5000);

        await respond(m, `Scheduling deadline for ${round ? `round ${round.abbreviation}` : `stage ${stage.abbreviation}`} set to ${discordStringTimestamp(date)}`);
        stopped = true;
        componentCollector.stop();
        inputDateCollector.stop();
    });
    inputDateCollector.on("end", () => timedOut(inputDateMessage, stopped, "Scheduling deadline change"));
}

const data = new SlashCommandBuilder()
    .setName("scheduling_deadline")
    .setDescription("Set a scheduling for a stage/round.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

const schedulingDeadline: Command = {
    data,
    alternativeNames: ["rescheduling_deadline"],
    category: "tournaments",
    subCategory: "stages",
    run,
};

export default schedulingDeadline;
