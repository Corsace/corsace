import { ChannelType, ChatInputCommandInteraction, ForumChannel, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import { extractParameters } from "../../functions/parameterFunctions";
import respond from "../../functions/respond";
import { unFinishedTournaments } from "../../../Models/tournaments/tournament";
import getTournament from "../../functions/tournamentFunctions/getTournament";
import channelID from "../../functions/channelID";
import { TournamentChannel } from "../../../Models/tournaments/tournamentChannel";
import getUser from "../../../Server/functions/get/getUser";
import commandUser from "../../functions/commandUser";
import { loginResponse } from "../../functions/loginResponse";
import confirmCommand from "../../functions/confirmCommand";
import { securityChecks } from "../../functions/tournamentFunctions/securityChecks";
import { TournamentChannelType, TournamentRoleType, forumTags } from "../../../Interfaces/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, true, [], [TournamentRoleType.Organizer]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const params = await extractParameters<parameters>(m, [
        { name: "channel", paramType: "channel" },
        { name: "remove", shortName: "r", paramType: "boolean", optional: true },
        { name: "channel_type", paramType: "string", optional: true },
    ]);
    if (!params) 
        return;

    const { channel, remove, channel_type } = params;

    if (!remove && !channel_type) {
        await respond(m, "Listen ur either gonna have to tell me to remove a channel, or ur gonna have to specify the channel type u want to add\n\nThe list of channel types are:\nGeneral (general)\nParticipants (participants)\nStaff (staff)\nCaptains (captains)\nAnnouncements (announcements)\nAdmin (admin)\nMappool (mappool)\nMappool Log (mappoollog)\nMappool QA (mappoolqa)\nJob Board (jobboard)\nReferees (referees)\nStreamers (streamers)\nMatchup Results (matchupresults)\n\nExample: `!tournament_channel #general general`");
        return;
    }

    const tournament = await getTournament(m, channelID(m), "channel", unFinishedTournaments);
    if (!tournament)
        return;

    const tournamentChannels = await TournamentChannel
        .createQueryBuilder("tournamentChannel")
        .leftJoinAndSelect("tournamentChannel.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: tournament.ID })
        .getMany();

    // Removing the channel
    if (remove) {
        if (tournamentChannels.length === 1) {
            await respond(m, "U can't remove the last tournament channel Lol");
            return;
        }

        const tournamentChannel = tournamentChannels.find(tournamentChannel => tournamentChannel.channelID === channel);
        if (!tournamentChannel) {
            await respond(m, `This channel is already not a tournament channel for ${tournament.name}`);
            return;
        }

        if (!await confirmCommand(m, `U sure u wanna remove <#${channel}> from ${tournament.name}?`)) {
            await respond(m, "K ,");
            return;
        }

        await tournamentChannel.remove();
        await respond(m, `Removed <#${channel}> from ${tournament.name}, it was a \`${TournamentChannelType[tournamentChannel.channelType]}\` channel`);
        return;
    }

    // Adding the channel
    if (!channel_type) { // This should never happen
        await respond(m, `This should never happen. Contact VINXIS and tell him everything u did and the command u just used`);
        return;
    }

    const discordChannel = m.guild!.channels.cache.get(channel);
    if (!discordChannel) {
        await respond(m, `Can't find a channel with the ID ${channel} <#${channel}>`);
        return;
    }

    const channelType = channel_type.toLowerCase().charAt(0).toUpperCase() + channel_type.toLowerCase().slice(1);
    if (
        !(channelType in TournamentChannelType) ||
        (channelType.toLowerCase() === "announcements" && channelType.toLowerCase() === "streamannouncements" && discordChannel.type !== ChannelType.GuildAnnouncement) || 
        (channelType.toLowerCase() === "mappoolqa" && discordChannel.type !== ChannelType.GuildForum) ||
        (channelType.toLowerCase() === "jobboard" && discordChannel.type !== ChannelType.GuildForum) ||
        (channelType.toLowerCase() !== "announcements" && channelType.toLowerCase() !== "streamannouncements" && channelType.toLowerCase() !== "mappoolqa" && channelType.toLowerCase() !== "jobboard" && discordChannel.type !== ChannelType.GuildText)
    ) {
        await respond(m, `The channel type \`${channel_type}\` is not a valid channel type\nAnnouncements should be a guild announcement channel\nMappool QA and Job Board should be guild forum channels\nAll other channels should be guild text channels`);
        return;
    }

    let tournamentChannel = tournamentChannels.find(tournamentChannel => tournamentChannel.channelID === channel);
    if (tournamentChannel) {
        await respond(m, `This channel's already a tournament channel for ${tournament.name}, it's a \`${TournamentChannelType[tournamentChannel.channelType]}\` channel`);
        return;
    }

    if (!await confirmCommand(m, `U sure u wanna add <#${channel}> to ${tournament.name} as a \`${channelType}\` channel?`)) {
        await respond(m, "K ,");
        return;
    }

    tournamentChannel = new TournamentChannel();
    tournamentChannel.createdBy = user;
    tournamentChannel.channelID = discordChannel.id;
    tournamentChannel.channelType = TournamentChannelType[channelType as keyof typeof TournamentChannelType];

    const tags = forumTags()[tournamentChannel.channelType];
    if (tags) {
        const forumChannel = discordChannel as ForumChannel;
        const tagsToAdd = tags.map(tag => {
            const forumTag = forumChannel.availableTags.find(t => t.name.toLowerCase() === tag.name.toLowerCase());
            if (forumTag)
                return forumTag;
            return tag;
        });
        await forumChannel.setAvailableTags(tagsToAdd);
    }

    tournamentChannel.tournament = tournament;
    await tournamentChannel.save();
    
    await respond(m, `Added <#${channel}> to ${tournament.name} as a \`${channelType}\` channel`);
}

const data = new SlashCommandBuilder()
    .setName("tournament_channel")
    .setDescription("Let's you add/remove a tournament channel to/from a tournament")
    .addChannelOption(option =>
        option.setName("channel")
            .setDescription("The channel to add/remove")
            .setRequired(true))
    .addBooleanOption(option =>
        option.setName("remove")
            .setDescription("Whether to remove the channel instead of adding it")
            .setRequired(false))
    .addStringOption(option =>
        option.setName("channel_type")
            .setDescription("The type of channel to add (Does nothing if removing)")
            .setRequired(false)
            .addChoices({
                name: "General",
                value: "General",
            },
            {
                name: "Participants",
                value: "Participants",
            },
            {
                name: "Staff",
                value: "Staff",
            },
            {
                name: "Captains",
                value: "Captains",
            },
            {
                name: "Announcements",
                value: "Announcements",
            },
            {
                name: "Stream Announcements",
                value: "Streamannouncements",
            },
            {
                name: "Admin",
                value: "Admin",
            },
            {
                name: "Mappool",
                value: "Mappool",
            },
            {
                name: "Mappool Log",
                value: "Mappoollog",
            },
            {
                name: "Mappool QA (For custom maps)",
                value: "Mappoolqa",
            },
            {
                name: "Job Board (For custom maps)",
                value: "Jobboard",
            },
            {
                name: "Testplayers",
                value: "Testplayers",
            },
            {
                name: "Referees",
                value: "Referee",
            },
            {
                name: "Streamers",
                value: "Stream",
            },
            {
                name: "Rescheduling",
                value: "Rescheduling",
            },
            {
                name: "Matchup Results",
                value: "Matchupresults",
            }))
    .setDMPermission(false);

interface parameters {
    channel: string,
    remove?: string,
    channel_type?: string,
}

const tournamentChannel: Command = {
    data,
    alternativeNames: [ "channel_tournaments", "channel_tournament", "tournaments_channel", "channel-tournaments", "channel-tournament", "tournaments-channel", "tournament-channel", "tournamentschannel", "tournamentchannel", "channeltournaments", "channeltournament", "channelt", "tchannel" ],
    category: "tournaments",
    run,
};

export default tournamentChannel;