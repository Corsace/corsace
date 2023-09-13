import { Message } from "discord.js";
import { TournamentChannel } from "../../../../Models/tournaments/tournamentChannel";
import { Tournament, TournamentStatus } from "../../../../Models/tournaments/tournament";
import { Brackets } from "typeorm";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { ojsamaParse, ojsamaToCustom } from "../../../functions/beatmapParse";
import getUser from "../../../../Server/functions/get/getUser";
import bypassSubmit from "../../../functions/tournamentFunctions/bypassSubmit";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import commandUser from "../../../functions/commandUser";
import channelID from "../../../functions/channelID";
import { TournamentRoleType, TournamentChannelType } from "../../../../Interfaces/tournament";

export default async function autoSubmit (m: Message) {
    if (!m.guild)
        return;

    // Check if an osz attachment is sent with the message
    let link = "";
    if (m.attachments.first())
        link = m.attachments.first()!.url;
    else if (/https?:\/\/\S+/.test(m.content))
        link = /https?:\/\/\S+/.exec(m.content)![0];
    else
        return;

    // Check if the link is an osz file
    if (!link.endsWith(".osz"))
        return;

    const channel = await TournamentChannel.findOne({
        where: {
            channelID: channelID(m),
        },
    });
    if (!channel)
        return;

    const allowedChannels = [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers];
    const allowed = allowedChannels.some(t => t === channel.channelType);
    if (!allowed)
        return;

    const tournaments = await Tournament.createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.mode", "mode")
        .leftJoin("tournament.channels", "channel")
        .where("tournament.server = :server", { server: m.guild.id })
        .andWhere("channel.channelID = :channelID", { channelID: channelID(m) })
        .andWhere("tournament.status IN (:...status)", { status: [ TournamentStatus.NotStarted.toString(), TournamentStatus.Ongoing.toString(), TournamentStatus.Registrations.toString() ]})
        .getMany();
    
    if (tournaments.length !== 1)
        return;

    const tournament = tournaments[0];

    const bypass = await bypassSubmit(m.member!.roles, tournament);
    if (!bypass) {
        const roles = await TournamentRole.find({ where: { tournament: { ID: tournament.ID } } });
        const roleFilter = roles.filter(role => role.roleType === TournamentRoleType.Mappers);
        if (roleFilter.length === 0 || !m.member!.roles.cache.hasAny(...roleFilter.map(r => r.roleID)))
            return;
    }

    const user = await getUser(m.author.id, "discord", false);
    if (!user)
        return;

    // Obtain beatmap data
    const diffRegex = /-d (.+)/;
    const diffMatch = diffRegex.exec(m.content);
    const beatmapData = await ojsamaParse(m, diffMatch?.[1] ?? "", link);
    if (!beatmapData?.beatmap)
        return;

    const mappoolMaps = await MappoolMap
        .createQueryBuilder("map")
        .leftJoinAndSelect("map.customMappers", "customMapper")
        .leftJoinAndSelect("map.testplayers", "testplayer")
        .leftJoinAndSelect("map.customBeatmap", "customBeatmap")
        .leftJoinAndSelect("customBeatmap.mode", "mode")
        .leftJoinAndSelect("map.slot", "slot")
        .leftJoinAndSelect("slot.maps", "slotMaps")
        .leftJoinAndSelect("slot.mappool", "mappool")
        .leftJoinAndSelect("mappool.round", "round")
        .leftJoinAndSelect("mappool.stage", "stage")
        .leftJoinAndSelect("stage.tournament", "tournament")
        .where("tournament.id = :tournamentID", { tournamentID: tournament.ID })
        .andWhere(new Brackets(qb => {
            qb
                .where(new Brackets(qb2 => {
                    qb2.where("customBeatmap.artist LIKE :artist", { artist: `%${beatmapData.beatmap!.artist}%` })
                        .andWhere("customBeatmap.title LIKE :title", { title: `%${beatmapData.beatmap!.title}%` })
                        .andWhere("customBeatmap.difficulty LIKE :diff", { diff: `%${beatmapData.beatmap!.version}%` });
                }))
                .orWhere("map.customThreadID = :threadID", { threadID: m.channel.id });
        }))
        .getMany();

    if (mappoolMaps.length !== 1 && !mappoolMaps.some(map => map.customThreadID === m.channel.id))
        return;

    const mappoolMap = mappoolMaps.length === 1 ? mappoolMaps[0] : mappoolMaps.find(map => map.customThreadID === m.channel.id)!;
    if (mappoolMap.slot.mappool.isPublic || (!bypass && !mappoolMap.customMappers.some(mapper => mapper.discord.userID === commandUser(m).id)))
        return;
        
    const mappoolSlot = `${mappoolMap.slot.mappool.abbreviation.toUpperCase()} ${mappoolMap.slot.acronym.toUpperCase()}${mappoolMap.slot.maps.length === 1 ? "" : mappoolMap.order}`;

    await ojsamaToCustom(m, tournament, mappoolMap.slot.mappool, mappoolMap.slot, mappoolMap, beatmapData, link, user, mappoolSlot);
    return;
}