import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { In, MoreThan } from "typeorm";
import { Command } from "..";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";
import respond from "../../functions/respond";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const serverOnly = m instanceof Message ? /-s(erver)?/.test(m.content) : m.options.getBoolean("server");
    const pastRegistration = m instanceof Message ? /-p(ast_)?r(egistration)?/.test(m.content) : m.options.getBoolean("past_registration");
    const finishedTournaments = m instanceof Message ? /-f(inished)?/.test(m.content) : m.options.getBoolean("finished");
    let mode = m instanceof Message ? /-m(ode)?\s+(.+)/.exec(m.content)?.[1] || "" : m.options.getString("mode") || "";

    if (serverOnly && !m.guild) {
        await respond(m, "You can only use this option in a server dude");
        return;
    }

    if (mode && !["osu", "taiko", "catch", "mania"].includes(mode)) {
        await respond(m, "Invalid mode");
        return;
    }

    const modeID = ["osu", "taiko", "catch", "mania"].indexOf(mode) + 1;

    const findOptions = {
        ...(serverOnly ? { server: m.guild!.id } : { }),
        ...(mode ? { mode: { ID: modeID } } : { }),
        ...(pastRegistration ? { } : { registrations: { end: MoreThan(new Date()) } }),
        ...(finishedTournaments ? { } : { status: In([TournamentStatus.NotStarted, TournamentStatus.Registrations, TournamentStatus.Ongoing]) }),
    };

    const tournaments = await Tournament.find({
        where: findOptions,
        relations: ["mode"],
    });

    if (tournaments.length === 0) {
        await respond(m, "No tournaments found");
        return;
    }

    const embed = {
        title: "Tournaments",
        description: tournaments.map(t => {
            return `**${t.name}** - ${t.mode.name} - <t:${t.registrations.start.getTime() / 1000}:F> - <t:${t.registrations.end.getTime() / 1000}:F> (<t:${t.registrations.start.getTime() / 1000}:R> - <t:${t.registrations.end.getTime() / 1000}:R>)`;
        }).join("\n"),
    };

    await respond(m, undefined, [embed]);
}

const data = new SlashCommandBuilder()
    .setName("list_tournaments")
    .setDescription("Lists currently running tournaments")
    .addBooleanOption(option => 
        option.setName("past_registration")
            .setDescription("List tournaments past registration date")
            .setRequired(false)
    )
    .addBooleanOption(option => 
        option.setName("finished")
            .setDescription("List tournaments that are finished")
            .setRequired(false)
    )
    .addBooleanOption(option => 
        option.setName("server")
            .setDescription("List tournaments in current server only")
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName("mode")
            .setDescription("Filter by mode")
            .setRequired(false)
            .addChoices(
                {
                    name: "osu!standard",
                    value: "osu",
                },
                {
                    name: "osu!taiko",
                    value: "taiko",
                },
                {
                    name: "osu!catch",
                    value: "catch",
                },
                {
                    name: "osu!mania",
                    value: "mania",
                }
            )
    );

const tournamentList: Command = {
    data,
    alternativeNames: ["list_tournament", "tournaments_list", "tournament_list", "list-tournaments", "list-tournament", "tournaments-list", "tournament-list", "tournamentslist", "tournamentlist", "listtournaments", "listtournament", "listt", "tlist", "tournamentl", "tournamentsl", "ltournament", "ltournaments"],
    category: "tournaments",
    run,
};

export default tournamentList;