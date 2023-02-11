import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { MoreThan, Not } from "typeorm";
import { Command } from "..";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    let serverOnly = false;
    let pastRegistration = false;
    let finishedTournaments = false;
    let mode = "";
    if (m instanceof ChatInputCommandInteraction) {
        serverOnly = m.options.getBoolean("server") ?? false;
        pastRegistration = m.options.getBoolean("past_registration") ?? false;
        finishedTournaments = m.options.getBoolean("finished") ?? false;
        mode = m.options.getString("mode") ?? "";
    } else {
        serverOnly = /-s(erver)?/.test(m.content);
        pastRegistration = /-p(ast_)?r(egistration)?/.test(m.content);
        finishedTournaments = /-f(inished)?/.test(m.content);
        mode = /-m(ode)?\s+(.+)/.exec(m.content)?.[1] ?? "";
    }

    if (serverOnly && !m.guild) {
        m.reply("You can only use this option in a server");
        return;
    }

    if (mode && !["osu", "taiko", "catch", "mania"].includes(mode)) {
        m.reply("Invalid mode");
        return;
    }

    const modeID = ["osu", "taiko", "catch", "mania"].indexOf(mode) + 1;

    const findOptions: any = {
        ...(serverOnly ? { server: m.guild?.id } : { }),
        ...(mode ? { mode: { ID: modeID } } : { }),
        ...(pastRegistration ? { } : { registrations: { end: MoreThan(new Date()) } }),
    };
    if (!finishedTournaments)
        findOptions.status = Not(TournamentStatus.Finished);

    const tournaments = await Tournament.find({
        where: findOptions,
        relations: ["mode"],
    });

    if (tournaments.length === 0) {
        m.reply("No tournaments found");
        return;
    }

    const embed = {
        title: "Tournaments",
        description: tournaments.map(t => {
            return `**${t.name}** - ${t.mode.name} - ${t.registrations.start.toDateString()} - ${t.registrations.end.toDateString()}`;
        }).join("\n"),
    };

    m.reply({ embeds: [embed] });
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
    category: "tournaments",
    run,
};

export default tournamentList;