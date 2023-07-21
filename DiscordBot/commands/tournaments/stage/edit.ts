import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import respond from "../../../functions/respond";
import channelID from "../../../functions/channelID";
import { TournamentStatus } from "../../../../Models/tournaments/tournament";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import { loginResponse } from "../../../functions/loginResponse";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import getStage from "../../../functions/tournamentFunctions/getStage";
import { Stage } from "../../../../Models/tournaments/stage";
import editProperty from "../../../functions/tournamentFunctions/editProperty";
import { profanityFilterStrong } from "../../../../Interfaces/comment";
import { discordStringTimestamp, parseDateOrTimestamp } from "../../../../Server/utils/dateParse";
import { ScoringMethod, StageType } from "../../../../Interfaces/stage";

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

    const tournament = await getTournament(m, channelID(m), "channel", [ TournamentStatus.NotStarted, TournamentStatus.Registrations ], true);
    if (!tournament)
        return;

    const stage = await getStage(m, tournament, false, tournament.ID, "tournamentID");
    if (!stage)
        return;

    const message = await respond(m, "Ok let's edit w/e u wanna edit");

    const existingStages = await Stage
        .createQueryBuilder("stage")
        .leftJoin("stage.tournament", "tournament")
        .where("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .getMany();

    await stageNameAbbreviation(message, stage, existingStages, commandUser(m).id, "name");
}

async function stageNameAbbreviation (m: Message, stage: Stage, existingStages: Stage[], userID: string, property: "name" | "abbreviation") {
    const editValue = await editProperty(m, property, "stage", stage[property], userID);
    if (!editValue)
        return;

    if (typeof editValue === "string") {
        let lengthCondition = false;
        let lengthMessage = "";
        let duplicateCheck = false;
        let duplicateMessage = "";

        if (property === "name") {
            lengthCondition = editValue.length > 48 || editValue.length < 5;
            lengthMessage = "The name must be between 5 and 48 characters";
            duplicateCheck = existingStages.some(pool => pool.name.toLowerCase() === editValue.toLowerCase());
            duplicateMessage = "A mappool with that name already exists";
        } else if (property === "abbreviation") {
            lengthCondition = editValue.length > 5 || editValue.length < 2;
            lengthMessage = "The abbreviation must be between 2 and 5 characters";
            duplicateCheck = existingStages.some(pool => pool.abbreviation.toLowerCase() === editValue.toLowerCase());
            duplicateMessage = "A mappool with that abbreviation already exists";
        }

        if (lengthCondition) {
            const reply = await m.channel.send(lengthMessage);
            setTimeout(async () => (await reply.delete()), 5000);
            await stageNameAbbreviation(m, stage, existingStages, userID, property);
            return;
        }

        if (duplicateCheck) {
            const reply = await m.channel.send(duplicateMessage);
            setTimeout(async () => (await reply.delete()), 5000);
            await stageNameAbbreviation(m, stage, existingStages, userID, property);
            return;
        }

        if (profanityFilterStrong.test(editValue)) {
            const reply = await m.channel.send(`This ${property} is sus . Choose a better ${property} .`);
            setTimeout(async () => (await reply.delete()), 5000);
            await stageNameAbbreviation(m, stage, existingStages, userID, property);
            return;
        }

        stage[property] = editValue;
    }

    if (property === "name")
        await stageNameAbbreviation(m, stage, existingStages, userID, "abbreviation");
    else
        await stageType(m, stage, userID);
}

async function stageType (m: Message, stage: Stage, userID: string) {
    const type = await editProperty(m, "type", "stage", StageType[stage.stageType], userID);
    if (!type)
        return;

    if (typeof type === "string") {
        const stageEnum = StageType[type.charAt(0).toUpperCase() + type.slice(1)];
        if (stageType === undefined) {
            const reply = await m.channel.send("Invalid type");
            setTimeout(async () => (await reply.delete()), 5000);
            await stageType(m, stage, userID);
            return;
        }

        if (stageEnum === StageType.Qualifiers && stage.tournament.stages.some(s => s.stageType === StageType.Qualifiers)) {
            const reply = await m.channel.send("There is already a qualifiers stage u can't make another one Lol");
            setTimeout(async () => (await reply.delete()), 5000);
            await stageType(m, stage, userID);
            return;
        }

        stage.stageType = stageEnum;
    }

    await stageTimespan(m, stage, userID, "start", stage.timespan.start);
}

async function stageTimespan (m: Message, stage: Stage, userID: string, property: "start" | "end", value: Date) {
    const result = await editProperty(m, property, "stage", value.toUTCString(), userID);
    if (!result)
        return;

    if (typeof result === "string") {
        const date = new Date(parseDateOrTimestamp(result));
        if (isNaN(date.getTime())) {
            const reply = await m.channel.send("Invalid date");
            setTimeout(async () => (await reply.delete()), 5000);
            await stageTimespan(m, stage, userID, property, value);
            return;
        }

        stage.timespan[property] = date;

        if (property === "end") {
            const start = stage.timespan.start;
            const end = stage.timespan.end;
            
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start.getTime() > end.getTime()) {
                const reply = await m.channel.send("Invalid timespan. Provide 2 dates in consecutive order.\n\n(e.g. `2021-01-01 2021-01-02`)");
                setTimeout(async () => (await reply.delete()), 5000);
                await stageTimespan(m, stage, userID, "start", stage.timespan.start);
                return;
            }
            if (stage.stageType !== StageType.Qualifiers && (start.getTime() < stage.tournament.registrations.end.getTime() || end.getTime() < stage.tournament.registrations.end.getTime())) {
                const reply = await m.channel.send("The stage overlaps with registrations. It's recommended to have between 2 weeks between registration end and the first stage's start in order to screen players as necessary");
                setTimeout(async () => (await reply.delete()), 5000);
                await stageTimespan(m, stage, userID, "start", stage.timespan.start);
                return;
            }
            let order = 1;
            for (const s of stage.tournament.stages) {
                if (
                    (start.getTime() > s.timespan.start.getTime() && start.getTime() < s.timespan.end.getTime()) ||
                    (end.getTime() > s.timespan.start.getTime() && end.getTime() < s.timespan.end.getTime()) ||
                    start.getTime() === s.timespan.start.getTime() ||
                    end.getTime() === s.timespan.end.getTime()
                ) {
                    const reply = await m.channel.send("The stage's timespan overlaps with another stage");
                    setTimeout(async () => (await reply.delete()), 5000);
                    await stageTimespan(m, stage, userID, "start", stage.timespan.start);
                    return;
                }

                // If the timestamp is after the stage's start, the order is increased
                if (s.timespan.start.getTime() < start.getTime())
                    order++;
            }

            stage.order = order;
            stage.timespan = {
                start,
                end,
            };
        }
    }

    if (property === "start")
        await stageTimespan(m, stage, userID, "end", stage.timespan.end);
    else
        await stageScoring(m, stage, userID);
}

async function stageScoring (m: Message, stage: Stage, userID: string) {
    const scoring = await editProperty(m, "scoring", "stage", ScoringMethod[stage.scoringMethod], userID);
    if (!scoring)
        return;

    if (typeof scoring === "string") {
        const scoringMethod = ScoringMethod[scoring];
        if (!scoringMethod) {
            const reply = await m.channel.send("Invalid scoring method");
            setTimeout(async () => (await reply.delete()), 5000);
            await stageScoring(m, stage, userID);
            return;
        }

        stage.scoringMethod = scoringMethod;
    }

    await stageTeamSize(m, stage, userID, "initialSize", stage.initialSize);
}

async function stageTeamSize (m: Message, stage: Stage, userID: string, property: "initialSize" | "finalSize", value: number) {
    const result = await editProperty(m, property, "stage", value.toString(), userID);
    if (!result)
        return;

    if (typeof result === "string") {
        const teamSize = parseInt(result);
        if (isNaN(teamSize)) {
            const reply = await m.channel.send("Invalid team count");
            setTimeout(async () => (await reply.delete()), 5000);
            await stageTeamSize(m, stage, userID, property, value);
            return;
        }

        if (property === "initialSize" && teamSize > stage.finalSize) {
            const reply = await m.channel.send("Initial team size must be smaller than final team size");
            setTimeout(async () => (await reply.delete()), 5000);
            await stageTeamSize(m, stage, userID, property, value);
            return;
        }

        stage[property] = teamSize;
    }

    if (property === "initialSize")
        await stageTeamSize(m, stage, userID, "finalSize", stage.finalSize);
    else if (stage.stageType === StageType.Qualifiers)
        await stageQualifierTeamChoose(m, stage, userID);
    else
        await stageSave(m, stage);
}

async function stageQualifierTeamChoose (m: Message, stage: Stage, userID: string) {
    const chooseOrder = await editProperty(m, "qualifierTeamChooseOrder", "stage", `${stage.qualifierTeamChooseOrder || false}`, userID);
    if (!chooseOrder)
        return;

    if (typeof chooseOrder === "string") {
        if (
            chooseOrder.toLowerCase() !== "true" && 
            chooseOrder.toLowerCase() !== "yes" && 
            chooseOrder.toLowerCase() !== "y" &&
            chooseOrder.toLowerCase() !== "false" &&
            chooseOrder.toLowerCase() !== "no" &&
            chooseOrder.toLowerCase() !== "n"
        ) {
            const reply = await m.channel.send("Invalid choice. Use the following: `true`, `yes`, `y`, `false`, `no`, `n`");
            setTimeout(async () => (await reply.delete()), 5000);
            await stageQualifierTeamChoose(m, stage, userID);
            return;
        }

        stage.qualifierTeamChooseOrder = chooseOrder.toLowerCase() === "true" || chooseOrder.toLowerCase() === "yes" || chooseOrder.toLowerCase() === "y";
    }

    await stageSave(m, stage);
}

async function stageSave (m: Message, stage: Stage) {
    await stage.save();

    // Move later stages up in order
    const laterStages = stage.tournament.stages.filter((s) => s.order >= stage.order);
    for (const s of laterStages) {
        if (s.order === stage.order && s.timespan.start < stage.timespan.start)
            continue;
        s.order++;
        await s.save();
    }
    
    const embed = new EmbedBuilder()
        .setTitle(stage.name)
        .setDescription(`${discordStringTimestamp(stage.timespan.start)} → ${discordStringTimestamp(stage.timespan.end)}`)
        .addFields(
            { name: "Stage ID", value: stage.ID.toString(), inline: true },
            { name: "Stage Type", value: StageType[stage.stageType], inline: true },
            { name: "Tournament", value: stage.tournament.name, inline: true },
            { name: "Scoring Method", value: ScoringMethod[stage.scoringMethod], inline: true },
            { name: "Stage Position/Order", value: stage.order.toString(), inline: true },
            { name: "# of Rounds", value: stage.rounds.length.toString(), inline: true },
            { name: "Initial → Final Team Count", value: stage.initialSize + " → " + stage.finalSize, inline: true }
        )
        .setTimestamp(new Date)
        .setAuthor({ name: commandUser(m).tag, iconURL: (m.member as GuildMember | null)?.displayAvatarURL() || undefined });

    if (stage.stageType === StageType.Qualifiers)
        embed.addFields({ name: "Team Qualifier Choose Order", value: stage.qualifierTeamChooseOrder ? "Yes" : "No", inline: true });

    await m.channel.send({ embeds: [ embed ] });
}

const data = new SlashCommandBuilder()
    .setName("stage_edit")
    .setDescription("Edit a stage.")
    .setDMPermission(false);

const stageEdit: Command = {
    data,
    alternativeNames: [ "edit_stage", "edit-stage","edits", "sedit", "stagee", "estage", "stage-edit", "stageedit", "editstage", "es", "se" ],
    category: "tournaments",
    subCategory: "stages",
    run,
};
    
export default stageEdit;