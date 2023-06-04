import { ChatInputCommandInteraction, Message, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import respond from "../../../functions/respond";
import channelID from "../../../functions/channelID";
import { TournamentStatus } from "../../../../Models/tournaments/tournament";
import confirmCommand from "../../../functions/confirmCommand";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { Round } from "../../../../Models/tournaments/round";
import deleteMappool from "../../../functions/dbFunctions/deleteMappool";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import { loginResponse } from "../../../functions/loginResponse";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import getStage from "../../../functions/tournamentFunctions/getStage";

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

    const confirm = await confirmCommand(m, `U RLY sure u wanna delete **${stage.name}**?\nIt'll also delete all of its rounds, mappools, slots, maps, and any custom beatmaps, job posts, and map history logged and associated with them`);
    if (!confirm) {
        await respond(m, "Loll ok then");
        return;
    }

    const rounds = await Round
        .createQueryBuilder("round")
        .leftJoin("round.stage", "stage")
        .where("stage.ID = :stageID", { stageID: stage.ID })
        .getMany();

    const mappools = await Mappool
        .createQueryBuilder("mappool")
        .leftJoin("mappool.stage", "stage")
        .leftJoin("mappool.round", "round")
        .leftJoin("round.stage", "roundStage")
        .leftJoinAndSelect("mappool.slots", "slot")
        .leftJoinAndSelect("slot.maps", "map")
        .leftJoinAndSelect("map.customBeatmap", "customBeatmap")
        .leftJoinAndSelect("map.jobPost", "jobPost")
        .leftJoinAndSelect("map.history", "history")
        .where("stage.ID = :stageID", { stageID: stage.ID })
        .orWhere("roundStage.ID = :stageID", { stageID: stage.ID })
        .getMany();

    await Promise.all(mappools.map(pool => deleteMappool(pool)));
    await Promise.all(rounds.map(round => round.remove()));
    await stage.remove();

    await Promise.all([
        respond(m, `Stage **${stage.name}** has been deleted`),
        mappoolLog(tournament, "deleteStage", user, `Stage \`${stage.name}\` has been deleted`),
    ]);
    return;
}

const data = new SlashCommandBuilder()
    .setName("stage_delete")
    .setDescription("Delete a stage.")
    .setDMPermission(false);

const stageDelete: Command = {
    data,
    alternativeNames: [ "delete_stage", "delete-stage","deletes", "sdelete", "staged", "dstage", "stage-delete", "stagedelete", "deletestage", "stage_del", "del_stage", "del-stage","dels", "sdel", "stage-del", "stagedel", "delstage" ],
    category: "tournaments",
    subCategory: "stages",
    run,
};
    
export default stageDelete;