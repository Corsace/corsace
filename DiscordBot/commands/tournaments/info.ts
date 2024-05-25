import { ChatInputCommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import getTournament from "../../functions/tournamentFunctions/getTournament";
import channelID from "../../functions/channelID";
import { extractParameters } from "../../functions/parameterFunctions";
import { discordStringTimestamp } from "../../../Server/utils/dateParse";
import { User } from "../../../Models/user";
import respond from "../../functions/respond";
import { StageType } from "../../../Interfaces/stage";
import { Tournament } from "../../../Models/tournaments/tournament";
import { TournamentRole } from "../../../Models/tournaments/tournamentRole";
import { Stage } from "../../../Models/tournaments/stage";
import { TournamentChannel } from "../../../Models/tournaments/tournamentChannel";
import { TournamentChannelType, TournamentRoleType } from "../../../Interfaces/tournament";

const info_typeToFunction = {
    "Stages": stageInfos,
    "Roles": roleInfos,
    "Channels": channelInfos,
};

const info_typeTextToKey = {
    "Stages": [ "stages", "stage", "rounds", "round", "s" ],
    "Roles": [ "roles", "role", "r" ],
    "Channels": [ "channels", "channel", "c" ],
};

function info_typePostProcess (parameter: string): Partial<parameters> | undefined {
    if (info_typeTextToKey.Stages.includes(parameter.toLowerCase()))
        return { info_type: "Stages" };
    if (info_typeTextToKey.Roles.includes(parameter.toLowerCase()))
        return { info_type: "Roles" };
    if (info_typeTextToKey.Channels.includes(parameter.toLowerCase()))
        return { info_type: "Channels" };
    return undefined;
}

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const params = await extractParameters<parameters>(m, [
        { name: "tournament", paramType: "string", optional: true },
        { name: "info_type", paramType: "string", optional: true, postProcess: info_typePostProcess },
    ]);
    if (!params) 
        return;

    const { tournament: tournamentParam, info_type } = params;

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel");
    if (!tournament)
        return;

    const organizer = await User
        .createQueryBuilder("user")
        .leftJoin("user.tournamentsOrganized", "tournament")
        .where("tournament.ID = :ID", { ID: tournament.ID })
        .getOne();
    if (!organizer) {
        await respond(m, `Somehow couldn't find the organizer for the tournament, contact VINXIS`);
        return;
    }

    // Create a discord embed for the tournament, listing its stages
    const embed = new EmbedBuilder()
        .setTitle(`${tournament.name} (${tournament.abbreviation})`)
        .setDescription(`Organized by ${organizer.osu.username} <@${organizer.discord.userID}>\n\n**ID:** ${tournament.ID}\n**Mode:** ${tournament.mode.name}\n**Registrations Start:** ${discordStringTimestamp(tournament.registrations.start)}\n**Registrations End:** ${discordStringTimestamp(tournament.registrations.end)}\n\n**Matchup Size:** ${tournament.matchupSize}v${tournament.matchupSize}\n**Team Sizes:** ${tournament.maxTeamSize === tournament.minTeamSize ? `${tournament.minTeamSize}` : `${tournament.minTeamSize} - ${tournament.maxTeamSize}`} player${tournament.maxTeamSize > 1 ? "s" : ""}\n\n**Description:** ${tournament.description}`);

    await info_typeToFunction[info_type ?? "Stages"](m, tournament, embed);
}

async function stageInfos (m: Message<boolean> | ChatInputCommandInteraction, tournament: Tournament, embed: EmbedBuilder) {
    const stages = await Stage
        .createQueryBuilder("stage")
        .leftJoinAndSelect("stage.rounds", "round")
        .leftJoinAndSelect("stage.mappool", "mappool")
        .leftJoinAndSelect("round.mappool", "roundMappool")
        .where("stage.tournamentID = :ID", { ID: tournament.ID })
        .getMany();

    embed.addFields(
        stages.map(s => {
            return {
                name: `**${s.name} (${s.abbreviation})** (${StageType[s.stageType]}) | ${discordStringTimestamp(s.timespan.start)} → ${discordStringTimestamp(s.timespan.end)}`,
                value: `**Rounds:**\n${s.rounds.map(r => `${r.name} (${r.abbreviation})`).join("\n") ?? "None"}\n\n**Mappools:**\n${s.mappool?.concat(s.rounds.flatMap(r => r.mappool)).map(m => `${m.name} (${m.abbreviation})`).join("\n") ?? "None"}`,
                inline: true,
            };
        })
    );

    await respond(m, undefined, [ embed ]);
}

async function roleInfos (m: Message<boolean> | ChatInputCommandInteraction, tournament: Tournament, embed: EmbedBuilder) {
    const roles = await TournamentRole
        .createQueryBuilder("role")
        .where("role.tournamentID = :ID", { ID: tournament.ID })
        .getMany();

    embed.addFields(
        roles.map(r => {
            return {
                name: `**${TournamentRoleType[r.roleType]}**`,
                value: `<@&${r.roleID}>`,
                inline: true,
            };
        })
    );

    await respond(m, undefined, [ embed ]);
}

async function channelInfos (m: Message<boolean> | ChatInputCommandInteraction, tournament: Tournament, embed: EmbedBuilder) {
    const channels = await TournamentChannel
        .createQueryBuilder("channel")
        .where("channel.tournamentID = :ID", { ID: tournament.ID })
        .getMany();

    embed.addFields(
        channels.map(c => {
            return {
                name: `**${TournamentChannelType[c.channelType]}**`,
                value: `<#${c.channelID}>`,
                inline: true,
            };
        })
    );

    await respond(m, undefined, [ embed ]);
}

const data = new SlashCommandBuilder()
    .setName("tournament_info")
    .setDescription("Get info for a tournament.")
    .addStringOption(option => 
        option.setName("tournament")
            .setDescription("The tournament to get info for (not required).")
            .setRequired(false))
    .addStringOption(option =>
        option.setName("info_type")
            .setDescription("The type of info to get (not required).")
            .setRequired(false)
            .addChoices({
                name: "Stages",
                value: "Stages",
            },
            {
                name: "Roles",
                value: "Roles",
            },
            {
                name: "Channels",
                value: "Channels",
            }));

interface parameters {
    tournament?: string,
    info_type?: "Stages" | "Roles" | "Channels",
}

const tournamentInfo: Command = {
    data,
    alternativeNames: [ "info_tournament", "info-tournament","infot", "tinfo", "tournamenti", "itournament", "tournament-info", "tournamentinfo", "infotournament", "it", "ti" ],
    category: "tournaments",
    run,
};
    
export default tournamentInfo;