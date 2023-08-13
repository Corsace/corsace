import { BanchoChannel, BanchoLobby, BanchoLobbyTeamModes, BanchoLobbyWinConditions } from "bancho.js";
import { randomUUID } from "crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMemberRoleManager, InteractionCollector, MessageComponentInteraction, TextChannel } from "discord.js";
import { banchoClient } from "../../..";
import { loginRow } from "../../../../DiscordBot/functions/loginResponse";
import { ScoringMethod, StageType } from "../../../../Interfaces/stage";
import { unallowedToPlay } from "../../../../Interfaces/tournament";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { TournamentChannel } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { User } from "../../../../Models/user";
import { discordClient } from "../../../../Server/discord";
import { convertDateToDDDHH } from "../../../../Server/utils/dateParse";
import invitePlayersToLobby from "./invitePlayersToLobby";
import { log } from "./log";

const winConditions = {
    [ScoringMethod.ScoreV2]: BanchoLobbyWinConditions.ScoreV2,
    [ScoringMethod.ScoreV1]: BanchoLobbyWinConditions.Score,
    [ScoringMethod.Accuracy]: BanchoLobbyWinConditions.Accuracy,
    [ScoringMethod.Combo]: BanchoLobbyWinConditions.Combo,
};

function runMatchupCheck (matchup: Matchup, replace: boolean) {
    if (!matchup.stage)
        throw new Error("Matchup has no stage");
    if (
        (!matchup.teams && matchup.stage.stageType === StageType.Qualifiers) ||
        (!matchup.team1 || !matchup.team2) && matchup.stage.stageType !== StageType.Qualifiers
    )
        throw new Error("Matchup has no teams");
    if (matchup.winner)
        throw new Error("Matchup already has a winner");
    if (matchup.mp && !replace)
        throw new Error("Matchup is already assigned to an mp ID");
    if (!matchup.round?.mappool && !matchup.stage.mappool)
        throw new Error("Matchup is missing mappool");
}

export default async function runMatchup (matchup: Matchup, replace = false, callback: (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel, invCollector?: InteractionCollector<any>, refCollector?: InteractionCollector<any>) => Promise<void>) {
    runMatchupCheck(matchup, replace);

    let lobbyName = `${matchup.stage!.tournament.abbreviation}: (${matchup.team1?.name}) vs (${matchup.team2?.name})`;
    if (matchup.stage!.stageType === StageType.Qualifiers)
        lobbyName = `${matchup.stage!.tournament.abbreviation}: (${convertDateToDDDHH(matchup.date)} QL) vs (${matchup.teams?.map(team => team.abbreviation).join(", ")})`;

    log(matchup, `Creating lobby with name ${lobbyName}`);
    const mpChannel = await banchoClient.createLobby(lobbyName, false);
    const mpLobby = mpChannel.lobby;
    log(matchup, `Created lobby with name ${lobbyName} and ID ${mpLobby.id}`);

    matchup.messages = [];
    matchup.maps = [];

    // no extra slot for qualifiers
    // slots for each team based on matchup size
    const requiredPlayerAmount = Math.min(16, (matchup.stage!.stageType === StageType.Qualifiers ? 0 : 1) + matchup.stage!.tournament.matchupSize * (matchup.teams?.length || 2));

    log(matchup, `Setting lobby settings, password and adding refs`);
    await Promise.all([
        mpLobby.setPassword(randomUUID()),
        mpLobby.setSettings(
            matchup.stage!.stageType === StageType.Qualifiers ? BanchoLobbyTeamModes.HeadToHead : BanchoLobbyTeamModes.TeamVs,
            winConditions[matchup.stage!.stageType] || BanchoLobbyWinConditions.ScoreV2,
            requiredPlayerAmount
        ),
        mpLobby.addRef([`#${matchup.stage!.tournament.organizer.osu.userID}`, `#${matchup.referee?.osu.userID || ""}`, `#${matchup.streamer?.osu.userID || ""}`]),
    ]);
    log(matchup, `Set lobby settings, password and added refs`);
    const refChannel = await TournamentChannel
        .createQueryBuilder("channel")
        .innerJoinAndSelect("channel.tournament", "tournament")
        .where("tournament.ID = :tournament", { tournament: matchup.stage!.tournament.ID })
        .andWhere("channel.channelType = '9'")
        .getOne();
    let refCollector: InteractionCollector<any> | undefined = undefined;
    if (refChannel) {
        const refID = randomUUID();
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(refID)
                    .setLabel("Re-addref")
                    .setStyle(ButtonStyle.Primary)
            );
            
        const discordChannel = discordClient.channels.cache.get(refChannel.channelID);
        if (discordChannel instanceof TextChannel) {
            const refMessage = await discordChannel.send({
                content: `Lobby has been created for \`${lobbyName}\` ID and channel \`#mp_${mpLobby.id}\`, if u need to be added or readded as a ref, and u have a role considered unallowed to play, press the button below.\n\n\`!start\` allows u to start the matchup if the team managers aren't able to make it\n\`!auto\` resumes the bot to run the lobby IF a user had used \`!panic\`\n\nMake sure u are online on osu! for the addref to work`,
                components: [row],
            });

            // Allow the message to stay up until lobby closes
            const roles = await TournamentRole
                .createQueryBuilder("role")
                .innerJoinAndSelect("role.tournament", "tournament")
                .where("tournament.ID = :tournament", { tournament: matchup.stage!.tournament.ID })
                .getMany();
            const refRoles = roles.filter(role => unallowedToPlay.includes(role.roleType));
            refCollector = refMessage.createMessageComponentCollector();
            refCollector.on("collect", async (i: MessageComponentInteraction) => {
                if (i.customId !== refID)
                    return;
                if (!i.member) {
                    await i.reply({ content: "couldnt receive ur member info", ephemeral: true });
                    return;
                }
                if (
                    (
                        i.member.roles instanceof GuildMemberRoleManager &&
                        !i.member.roles.cache.some(role => refRoles.some(refRole => refRole.roleID === role.id))
                    ) ||
                    (
                        !(i.member.roles instanceof GuildMemberRoleManager) &&
                        !i.member.roles.some(role => refRoles.some(refRole => refRole.roleID === role))
                    )
                ) {
                    await i.reply({ content: "ur not allowed to ref .", ephemeral: true });
                    return;
                }
                const user = await User
                    .createQueryBuilder("user")
                    .where("user.discord.userID = :discord", { discord: i.user.id })
                    .getOne();
                if (!user) {
                    await i.reply({ content: "couldnt find u in the database make sure u are logged in .", ephemeral: true, components: [loginRow] });
                    return;
                }
                await mpLobby.addRef([`#${user.osu.userID}`]);
                await i.reply({ content: "Addreffed", ephemeral: true });
            });
            refCollector.on("end", async () => {
                if (!refMessage.deletable)
                    return;
                await refMessage.delete();
            });
            log(matchup, `Created addref message`);
        }
    }

    log(matchup, `Inviting players`);
    const IDs = await invitePlayersToLobby(matchup, mpLobby);
    log(matchup, `Invited players`);

    const generalChannel = await TournamentChannel
        .createQueryBuilder("channel")
        .innerJoinAndSelect("channel.tournament", "tournament")
        .where("tournament.ID = :tournament", { tournament: matchup.stage!.tournament.ID })
        .andWhere("channel.channelType = '0'")
        .getOne();
    let invCollector: InteractionCollector<any> | undefined = undefined;
    if (generalChannel) {
        const inviteID = randomUUID();
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(inviteID)
                    .setLabel("Resend invite")
                    .setStyle(ButtonStyle.Primary)
            );
    
        const discordChannel = discordClient.channels.cache.get(generalChannel.channelID);
        if (discordChannel instanceof TextChannel) {
            const invMessage = await discordChannel.send({
                content: `${IDs.map(id => `<@${id.discord}>`).join(" ")}\n\nLobby has been created for ur match, if u need to be reinvited, press the button below.\n\nMake sure u have non-friends DMs allowed on osu!\n\nThe following commands work in lobby:\n\`!panic\` will notify organizers/currently assigned refs if anything goes absurdly wrong and stop auto-running the lobby\n\`!abort\` allows u to abort a map within the allowed time after a map start, and for the allowed amount of times a team is allowed to abort\n\`!start\` allows a manager to start the matchup before the match time if the manager appears in the lobby beforehand\n\nIf ur not part of the matchup, the button wont work for u .`,
                components: [row],
            });

            // Allow the message to stay up and send invites until the lobby closes
            invCollector = invMessage.createMessageComponentCollector();
            invCollector.on("collect", async (i: MessageComponentInteraction) => {
                if (i.customId !== inviteID)
                    return;
                const osuID = IDs.find(id => id.discord === i.user.id)?.osu;
                if (!osuID) {
                    await i.reply({ content: "What did i tell u .", ephemeral: true });
                    return;
                }
                await mpLobby.invitePlayer(`#${osuID}`);
                await i.reply({ content: "Invite sent", ephemeral: true });
            });
            invCollector.on("end", async () => {
                if (!invMessage.deletable)
                    return;
                await invMessage.delete();
            });
            log(matchup, `Created invite message for ${IDs.length} players`);
        }
    }

    await callback(matchup, mpLobby, mpChannel, invCollector, refCollector);
}