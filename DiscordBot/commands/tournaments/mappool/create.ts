import { ChatInputCommandInteraction, Message, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { Command } from "../..";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { Tournament, TournamentStatus } from "../../../../Models/tournaments/tournament";
import { fetchStage, fetchTournament } from "../../../functions/fetchTournament";

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

    const stage = await fetchStage(message, tournament);
    if (!stage)
        return;
    
    const mappool = new Mappool();
    mappool.stage = stage;
    // Do this after making round stuff

    if (m instanceof ChatInputCommandInteraction)
        await m.deleteReply();
}

const data = new SlashCommandBuilder()
    .setName("")
    .setDescription("")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

const mappoolCreate: Command = {
    data,
    category: "tournaments",
    run,
};
    
export default mappoolCreate;