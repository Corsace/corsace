import { ChannelMessage, PrivateMessage } from "bancho.js";
import { Command } from "../index";
import { discordClient } from "../../../Server/discord";
import { TournamentChannel } from "../../../Models/tournaments/tournamentChannel";
import { TextChannel } from "discord.js";
import state from "../../state";

async function run (message: PrivateMessage | ChannelMessage) {
    if (!(message instanceof ChannelMessage) || !/#mp_(\d+)/.test(message.channel.name))
        return;

    const mpID = parseInt(message.channel.name.match(/#mp_(\d+)/)![1]);
    
    if (isNaN(mpID) || !state.matchups[mpID] || !state.matchups[mpID].autoRunning)
        return;

    const matchup = state.matchups[mpID].matchup;

    const channels = await TournamentChannel
        .createQueryBuilder("channel")
        .leftJoinAndSelect("channel.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: matchup.stage!.tournament.ID })
        .andWhere("channel.channelType = '9'")
        .getMany();
    
    if (channels.length === 0) {
        await message.user.sendMessage(`No ref channel found`);
        return;
    }

    const refChannel = channels[0];
    const discordChannel = discordClient.channels.cache.get(refChannel.channelID);
    if (!(discordChannel instanceof TextChannel)) {
        await message.user.sendMessage(`No ref channel found`);
        return;
    }

    await discordChannel.send(`@here <@${matchup.stage!.tournament.organizer.discord.userID}> ${matchup.referee ? `<@${matchup.referee.discord.userID}>` : ""} ${matchup.streamer ? `<@${matchup.streamer.discord.userID}>` : ""}\n${message.user.username} is PANICING for the matchup Omggg go helkp them\n\nAuto-running lobby has stopped`);

    state.matchups[mpID].autoRunning = false;

    await message.user.sendMessage(`ok i notified the refs and organizer(s) of the tourney and stopped the auto lobby for u`);
}

const panic: Command = {
    name: "panic",
    aliases: ["alert"],
    run,
};

export default panic;
