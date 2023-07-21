import { ChatInputCommandInteraction, EmbedBuilder, Message, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import getUser from "../../../Server/functions/get/getUser";
import commandUser from "../../functions/commandUser";
import { loginResponse } from "../../functions/loginResponse";
import getTournament from "../../functions/tournamentFunctions/getTournament";
import channelID from "../../functions/channelID";
import { SortOrder, Tournament, TournamentStatus, sortTextToOrder } from "../../../Models/tournaments/tournament";
import respond from "../../functions/respond";
import editProperty from "../../functions/tournamentFunctions/editProperty";
import { profanityFilterStrong } from "../../../Interfaces/comment";
import { ModeDivision, ModeDivisionType, modeTextHash, modeTextToID } from "../../../Models/MCA_AYIM/modeDivision";
import { discordStringTimestamp, parseDateOrTimestamp } from "../../../Server/utils/dateParse";
import { StageType } from "../../../Interfaces/stage";

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
    
    const message = await respond(m, "Ok let's edit w/e u wanna edit");

    await tournamentNameAbbreviationDescription(message, tournament, commandUser(m).id, "name");
}

async function tournamentNameAbbreviationDescription (m: Message, tournament: Tournament, userID: string, property: "name" | "abbreviation" | "description") {
    const editValue = await editProperty(m, property, "tournament", tournament[property], userID);
    if (!editValue)
        return;

    if (typeof editValue === "string") {
        let lengthCondition = false;
        let lengthMessage = "";

        if (property === "name") {
            lengthCondition = editValue.length > 50 || editValue.length < 3;
            lengthMessage = "The name must be between 3 and 50 characters";
        } else if (property === "abbreviation") {
            lengthCondition = editValue.length > 8 || editValue.length < 2;
            lengthMessage = "The abbreviation must be between 2 and 8 characters";
        } else if (property === "description") {
            lengthCondition = editValue.length > 1024 || editValue.length < 3;
            lengthMessage = "The description must be between 3 and 1024 characters";
        }

        if (lengthCondition) {
            const reply = await m.channel.send(lengthMessage);
            setTimeout(async () => (await reply.delete()), 5000);
            await tournamentNameAbbreviationDescription(m, tournament, userID, property);
            return;
        }

        if (profanityFilterStrong.test(editValue)) {
            const reply = await m.channel.send(`This ${property} is sus . Choose a better ${property} .`);
            setTimeout(async () => (await reply.delete()), 5000);
            await tournamentNameAbbreviationDescription(m, tournament, userID, property);
            return;
        }

        tournament[property] = editValue;
    }

    if (property === "name")
        await tournamentNameAbbreviationDescription(m, tournament, userID, "abbreviation");
    else if (property === "abbreviation")
        await tournamentNameAbbreviationDescription(m, tournament, userID, "description");
    else
        await tournamentMode(m, tournament, userID);
}

async function tournamentMode (m: Message, tournament: Tournament, userID: string) {
    const editValue = await editProperty(m, "mode", "tournament", ModeDivisionType[tournament.mode.ID], userID);
    if (!editValue)
        return;

    if (typeof editValue === "string") {
        const mode = modeTextToID(editValue);
        if (!mode) {
            const reply = await m.channel.send(`Invalid mode. Valid mode inputs are ${Object.keys(modeTextHash).join(", ")}`);
            setTimeout(async () => (await reply.delete()), 5000);
            await tournamentMode(m, tournament, userID);
            return;
        }

        const modeDivision = await ModeDivision.findOne({
            where: {
                ID: mode,
            },
        });
        if (!modeDivision) {
            const reply = await m.channel.send("Couldn't find that mode probably doesn't exist however the hell u did that");
            setTimeout(async () => (await reply.delete()), 5000);
            await tournamentMode(m, tournament, userID);
            return;
        }

        tournament.mode = modeDivision;
    }

    await tournamentPlayersInMatchup(m, tournament, userID);
}

async function tournamentPlayersInMatchup (m: Message, tournament: Tournament, userID: string) {
    const editValue = await editProperty(m, "players in match (the x in x vs x)", "tournament", tournament.matchupSize.toString(), userID);
    if (!editValue)
        return;

    if (typeof editValue === "string") {
        const matchupSize = parseInt(editValue);
        if (isNaN(matchupSize) || matchupSize < 1 || matchupSize > 16) {
            const reply = await m.channel.send("Invalid match size. Must be a number between 1 and 16");
            setTimeout(async () => (await reply.delete()), 5000);
            await tournamentPlayersInMatchup(m, tournament, userID);
            return;
        }

        tournament.matchupSize = matchupSize;
    }

    await tournamentMinMaxPlayers(m, tournament, userID, "minTeamSize", tournament.minTeamSize);
}

async function tournamentMinMaxPlayers (m: Message, tournament: Tournament, userID: string, property: "minTeamSize" | "maxTeamSize", value: number) {
    const result = await editProperty(m, property, "tournament", value.toString(), userID);
    if (!result)
        return;

    if (typeof result === "string") {
        const teamSize = parseInt(result);
        if (isNaN(teamSize)) {
            const reply = await m.channel.send("Invalid team count");
            setTimeout(async () => (await reply.delete()), 5000);
            await tournamentMinMaxPlayers(m, tournament, userID, property, value);
            return;
        }

        if (property === "minTeamSize") {
            if (teamSize < 1) {
                const reply = await m.channel.send("Min team size must be greater than or equal to 1 u can't have less than 1 player teams");
                setTimeout(async () => (await reply.delete()), 5000);
                await tournamentMinMaxPlayers(m, tournament, userID, property, value);
                return;
            }

            if (teamSize < tournament.matchupSize) {
                const reply = await m.channel.send("Min team size must be greater than or equal to match size");
                setTimeout(async () => (await reply.delete()), 5000);
                await tournamentMinMaxPlayers(m, tournament, userID, property, value);
                return;
            }

            if (teamSize > 16) {
                const reply = await m.channel.send("Min team size must be less than or equal to 16");
                setTimeout(async () => (await reply.delete()), 5000);
                await tournamentMinMaxPlayers(m, tournament, userID, property, value);
                return;
            }
        }

        if (property === "maxTeamSize") {
            if (teamSize < tournament.minTeamSize) {
                const reply = await m.channel.send("Max team size must be greater than or equal to min team size");
                setTimeout(async () => (await reply.delete()), 5000);
                await tournamentMinMaxPlayers(m, tournament, userID, property, value);
                return;
            }

            if (teamSize > 32) {
                const reply = await m.channel.send("Max team size must be less than or equal to 32");
                setTimeout(async () => (await reply.delete()), 5000);
                await tournamentMinMaxPlayers(m, tournament, userID, property, value);
                return;
            }
        }

        tournament[property] = teamSize;
    } else if (property === "maxTeamSize") {
        if (tournament.maxTeamSize < tournament.minTeamSize) {
            const reply = await m.channel.send("Max team size must be greater than or equal to min team size so ur other gonna have to change ur new min team size to something lower or actually change ur max team size");
            setTimeout(async () => (await reply.delete()), 5000);
            await tournamentMinMaxPlayers(m, tournament, userID, "minTeamSize", tournament.minTeamSize);
            return;
        }
    }

    if (property === "minTeamSize")
        await tournamentMinMaxPlayers(m, tournament, userID, "maxTeamSize", tournament.maxTeamSize);
    else
        await tournamentRegistrationTimespan(m, tournament, userID, "start", tournament.registrations.start);
}

async function tournamentRegistrationTimespan (m: Message, tournament: Tournament, userID: string, property: "start" | "end", value: Date) {
    const result = await editProperty(m, property, "tournament", value.toUTCString(), userID);
    if (!result)
        return;

    if (typeof result === "string") {
        const date = new Date(parseDateOrTimestamp(result));
        if (isNaN(date.getTime())) {
            const reply = await m.channel.send("Invalid date");
            setTimeout(async () => (await reply.delete()), 5000);
            await tournamentRegistrationTimespan(m, tournament, userID, property, value);
            return;
        }

        if (property === "end") {
            if (tournament.registrations.start.getTime() > date.getTime()) {
                const reply = await m.channel.send("The registration end date must be after the registration start date");
                setTimeout(async () => (await reply.delete()), 5000);
                await tournamentRegistrationTimespan(m, tournament, userID, "start", tournament.registrations.start);
                return;
            }

            if (date.getTime() < Date.now()) {
                const reply = await m.channel.send("The registration end date must be in the future");
                setTimeout(async () => (await reply.delete()), 5000);
                await tournamentRegistrationTimespan(m, tournament, userID, "start", tournament.registrations.start);
                return;
            }
        }

        tournament.registrations[property] = date;
        tournament.year = property === "start" ? tournament.year : date.getUTCFullYear();
    } else if (property === "end") {
        if (tournament.registrations.end.getTime() < tournament.registrations.start.getTime()) {
            const reply = await m.channel.send("The registration end date must be after the registration start date so ur other gonna have to change ur new start date to something higher or actually change ur end date");
            setTimeout(async () => (await reply.delete()), 5000);
            await tournamentRegistrationTimespan(m, tournament, userID, "start", tournament.registrations.start);
            return;
        }
    }

    if (property === "start")
        await tournamentRegistrationTimespan(m, tournament, userID, "end", tournament.registrations.end);
    else
        await tournamentSortOrder(m, tournament, userID);
}

async function tournamentSortOrder (m: Message, tournament: Tournament, userID: string) {
    const editValue = await editProperty(m, "sort order", "tournament", SortOrder[tournament.regSortOrder], userID);
    if (!editValue)
        return;

    if (typeof editValue === "string") {
        const sortOrder = sortTextToOrder(editValue);
        if (sortOrder === -1) {
            const reply = await m.channel.send(`Invalid sort order. Valid sort orders are ${Object.keys(SortOrder).join(", ")}`);
            setTimeout(async () => (await reply.delete()), 5000);
            await tournamentSortOrder(m, tournament, userID);
            return;
        }

        tournament.regSortOrder = sortOrder;
    }

    await tournamentSave(m, tournament);
}

async function tournamentSave (m: Message, tournament: Tournament) {
    await tournament.save();

    const embed = new EmbedBuilder()
        .setTitle(tournament.name)
        .setDescription(tournament.description)
        .addFields(
            { name: "Mode", value: tournament.mode.name, inline: true },
            { name: "Match Size", value: tournament.matchupSize.toString(), inline: true },
            { name: "Allowed Team Size", value: `${tournament.minTeamSize} - ${tournament.maxTeamSize}`, inline: true },
            { name: "Registration Start Date", value: discordStringTimestamp(tournament.registrations.start), inline: true },
            { name: "Qualifiers", value: tournament.stages.some(q => q.stageType === StageType.Qualifiers).toString(), inline: true },
            { name: "Invitational", value: tournament.invitational ? "Yes" : "No", inline: true },
            { name: "Server", value: tournament.server, inline: true }
        )
        .setTimestamp(new Date)
        .setAuthor({ name: m.author.username, iconURL: m.member?.avatarURL() ?? undefined });

    if (tournament.isOpen || tournament.isClosed)
        embed.addFields(
            { name: "Corsace", value: tournament.isOpen ? "Open" : "Closed", inline: true }
        );

    m.reply({ content: "Nice u saved the tournament!!!1\nHere's the tournament embed:", embeds: [embed] });
}

const data = new SlashCommandBuilder()
    .setName("tournament_edit")
    .setDescription("Edit a tournament.")
    .setDMPermission(false);

const tournamentEdit: Command = {
    data,
    alternativeNames: [ "edit_tournament", "edit-tournament","editt", "tedit", "tournamente", "etournament", "tournament-edit", "tournamentedit", "edittournament", "et", "te" ],
    category: "tournaments",
    run,
};
    
export default tournamentEdit;