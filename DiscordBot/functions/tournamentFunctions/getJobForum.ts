import { ChannelType, ChatInputCommandInteraction, ForumChannel, Message } from "discord.js";
import { TournamentChannelType } from "../../../Interfaces/tournament";
import { Tournament } from "../../../Models/tournaments/tournament";
import { TournamentChannel } from "../../../Models/tournaments/tournamentChannel";
import { discordClient } from "../../../Server/discord";
import respond from "../respond";

export default async function getJobForum (m: Message | ChatInputCommandInteraction, tournament: Tournament): Promise<ForumChannel | undefined> {
    const tourneyChannels = await TournamentChannel.find({
        where: {
            tournament: {
                ID: tournament.ID,
            },
        },
    });
    const tournamentChannel = tourneyChannels.find(c => c.channelType === TournamentChannelType.Jobboard);
    const thread = discordClient.channels.cache.get(tournamentChannel?.channelID ?? "");
    if (!(thread && thread.type === ChannelType.GuildForum)) {
        await respond(m, `Can't find the job forum channel for tournament ${tournament.name}`);
        return;
    }

    return thread ;
}