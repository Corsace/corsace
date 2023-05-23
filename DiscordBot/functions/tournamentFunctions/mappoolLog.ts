import { EmbedBuilder, TextChannel } from "discord.js";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { MappoolMapHistory } from "../../../Models/tournaments/mappools/mappoolMapHistory";
import { MappoolSlot } from "../../../Models/tournaments/mappools/mappoolSlot";
import { Tournament } from "../../../Models/tournaments/tournament";
import { TournamentChannel, TournamentChannelType } from "../../../Models/tournaments/tournamentChannel";
import { User } from "../../../Models/user";
import modeColour from "../modeColour";
import { discordClient } from "../../../Server/discord";

export default async function mappoolLog(tournament: Tournament, command: string, user: User, log: MappoolMapHistory, mappoolSlot: string)
export default async function mappoolLog(tournament: Tournament, command: string, user: User, event: string)
export default async function mappoolLog(tournament: Tournament, command: string, user: User, logOrEvent: MappoolMapHistory | string, mappoolSlot?: string) {
    const tournamentChannels = await TournamentChannel.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const mappoolLogChannels = tournamentChannels.filter(c => c.channelType === TournamentChannelType.Mappoollog);
    if (mappoolLogChannels.length === 0)
        return;

    const embed = new EmbedBuilder();
    embed.setTitle(`\`${command}\` was run by ${user!.osu.username}`);

    if (logOrEvent instanceof MappoolMapHistory) {
        const log = logOrEvent;
        embed.setDescription(`${log.link ? "Custom map" : "Beatmap" } was added to slot \`${mappoolSlot!}\``);
        embed.addFields({ name: "Map", value: log.beatmap ? `${log.beatmap.beatmapset.artist} - ${log.beatmap.beatmapset.title} [${log.beatmap.difficulty}]` : `${log.artist} - ${log.title} [${log.difficulty}]`});
        if (log.link) embed.addFields({ name: "Link", value: log.link });
        embed.setThumbnail(log.beatmap ? `https://b.ppy.sh/thumb/${log.beatmap.beatmapset.ID}l.jpg` : null);
        embed.setColor(modeColour(tournament.mode.ID - 1));
        embed.setTimestamp();
    } else {
        const event = logOrEvent;
        embed.setDescription(event);
        embed.setColor(modeColour(tournament.mode.ID - 1));
        embed.setTimestamp();
    }

    await Promise.all(mappoolLogChannels.map(async channel => {
        const c = await discordClient.channels.fetch(channel.channelID) as TextChannel | null;
        if (c)
            return c.send({ embeds: [embed] });
    }));
}