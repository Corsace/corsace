import { BanchoMessage } from "bancho.js";
import { Command } from "../index";
import { Multi } from "nodesu";
import { Matchup } from "../../../Models/tournaments/matchup";
import { discordClient } from "../../../Server/discord";
import { TournamentChannel } from "../../../Models/tournaments/tournamentChannel";
import { TextChannel } from "discord.js";
import state from "../../state";

async function run (message: BanchoMessage, multi: Multi, ...args: string[]) {
    if (!state.matchups[multi.match.id])
        return;

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.streamer", "streamer")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .innerJoinAndSelect("tournament.organizer", "organizer")
        .where("matchup.ID = :ID", { ID: multi.match.id })
        .getOne();

    if (!matchup) {
        await message.user.sendMessage(`couldn't find this matchup in the DB`);
        return;
    }

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

    await discordChannel.send(`@here <@${matchup.stage!.tournament.organizer.discord.userID}> ${matchup.referee ? `<@${matchup.referee.discord.userID}>` : ""} ${matchup.streamer ? `<@${matchup.streamer.discord.userID}>` : ""}\n${message.user.username} is PANICING for the matchup ${multi.match.name} Omggg go helkp them`);

    state.matchups[multi.match.id].autoRunning = false;

    await message.user.sendMessage(`ok i notified the refs and organizer(s) of the tourney and stopped the auto lobby for u`);
}

const panic: Command = {
    name: "panic",
    aliases: ["alert"],
    multiplayerCommand: true,
    run,
};

export default panic;
