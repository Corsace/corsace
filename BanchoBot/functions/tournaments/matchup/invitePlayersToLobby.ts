import { BanchoLobby } from "bancho.js";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType } from "../../../../Interfaces/stage";
import { TournamentChannel } from "../../../../Models/tournaments/tournamentChannel";
import { discordClient } from "../../../../Server/discord";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageComponentInteraction, TextChannel } from "discord.js";
import { randomUUID } from "crypto";

export default async function invitePlayersToLobby (matchup: Matchup, mpLobby: BanchoLobby) {
    const generalChannel = await TournamentChannel
        .createQueryBuilder("channel")
        .innerJoinAndSelect("channel.tournament", "tournament")
        .where("tournament.ID = :tournament", { tournament: matchup.stage!.tournament.ID })
        .andWhere("channel.channelType = '0'")
        .getOne();

    const inviteID = randomUUID();
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(inviteID)
                .setLabel("Resend invite")
                .setStyle(ButtonStyle.Link)
        );

    const IDs: {
        osu: string;
        discord: string;
    }[] = [];
    if (matchup.stage!.stageType === StageType.Qualifiers) {
        const users = matchup.teams!.flatMap(team => team.members.concat(team.manager).filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i));
        await Promise.all(users.map(user => mpLobby.invitePlayer(`#${user.osu.userID}`)));
        IDs.push(...users.map(u => ({ osu: u.osu.userID, discord: u.discord.userID })));
    } else {
        const users = matchup.team1!.members.concat(matchup.team1!.manager).concat(matchup.team2!.members).concat(matchup.team2!.manager).filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i);
        await Promise.all(users.map(m => mpLobby.invitePlayer(`#${m.osu.userID}`)));
        IDs.push(...users.map(u => ({ osu: u.osu.userID, discord: u.discord.userID })));
    }

    if (!generalChannel)
        return;

    const discordChannel = discordClient.channels.cache.get(generalChannel.channelID);
    if (!(discordChannel instanceof TextChannel))
        return;
    
    const invMessage = await discordChannel.send({
        content: `${IDs.map(id => `<@${id.discord}>`).join(" ")}\n Lobby has been created for your match. If you need to be reinvited, press the button below.\n\nMake sure you have non-friends DMs allowed on osu!`,
        components: [row],
    });

    // Allow the message to stay up and send invites for the next 20 minutes
    const filter = (i: MessageComponentInteraction) => IDs.some(id => id.discord === i.user.id);
    const componentCollector = invMessage.createMessageComponentCollector({ filter, time: 1200000 });
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {
        if (i.customId !== inviteID)
            return;
        const osuID = IDs.find(id => id.discord === i.user.id)?.osu;
        if (!osuID) {
            await i.reply({ content: "U SURE U IN THIS LOBBY??? I CAN'T FIND U . if this is an error tell VINXIS", ephemeral: true });
            return;
        }
        await mpLobby.invitePlayer(`#${osuID}`);
        await i.reply({ content: "Invite sent", ephemeral: true });
    });
    componentCollector.on("end", async () => {
        if (!invMessage.deletable)
            return;
        await invMessage.delete();
    });
}