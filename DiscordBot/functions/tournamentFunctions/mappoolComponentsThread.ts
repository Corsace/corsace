import { ThreadChannel, User as DiscordUser, Message, DiscordAPIError } from "discord.js";
import { User } from "../../../Models/user";
import { Tournament, unFinishedTournaments } from "../../../Models/tournaments/tournament";
import { TournamentRole, TournamentRoleType } from "../../../Models/tournaments/tournamentRole";
import mappoolComponents from "./mappoolComponents";
import respond from "../respond";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";
import { TournamentChannel, TournamentChannelType } from "../../../Models/tournaments/tournamentChannel";
import { discordClient } from "../../../Server/discord";

export type mappoolComponentsThreadType = {
    m: Message;
    creator: User;
    tournament: Tournament;
    mappoolMap: MappoolMap;
    mappers: string[];
};

export default async function mappoolComponentsThread (t: ThreadChannel, owner: DiscordUser, channel?: TournamentChannel): Promise<mappoolComponentsThreadType | undefined> {
    const creator = await User.findOne({ where: { discord: { userID: owner.id } } });
    if (!creator)
        return;

    const threadName = t.name;

    // Get the pool, slot, and mappers
    const poolRegex = /(\S+) (\S+)( \((.+)\))?/;
    const poolMatch = threadName.match(poolRegex);
    if (!poolMatch)
        return;

    const order = parseInt(poolMatch[2][poolMatch[2].length - 1]);
    if (isNaN(order))
        return;
    const poolText = poolMatch[1];
    const slotText = poolMatch[2].slice(0, poolMatch[2].length - 1);
    const mappers = poolMatch[4] ? poolMatch[4].split(", ") : [];

    let m: Message | undefined = undefined;
    try {
        m = await t.send("Loading...");
    } catch (e) {
        if (!(e instanceof DiscordAPIError)) 
            throw e;
        if (!channel)
            return;

        const tournamentChannels = await TournamentChannel
            .createQueryBuilder("channel")
            .leftJoinAndSelect("channel.tournament", "tournament")
            .where("tournament.ID = :id", { id: channel.tournament.ID })
            .getMany();
        if (tournamentChannels.length === 0)
            return;

        const adminChannel = tournamentChannels.find(c => c.channelType === TournamentChannelType.Admin);
        if (!adminChannel)
            return;

        const adminDiscordChannel = await discordClient.channels.fetch(adminChannel.channelID);
        if (!adminDiscordChannel || !("send" in adminDiscordChannel))
            return;

        m = await adminDiscordChannel.send("Loading...");
    }

    const components = await mappoolComponents(m, poolText, slotText, order, true, { text: t.parentId!, searchType: "channel" }, unFinishedTournaments, false, undefined, true);
    if (!components || !("mappoolMap" in components)) {
        await respond(m, "Invalid pool, slot, or order.");
        return;
    }

    const { tournament, mappoolMap } = components;

    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const targetRoles = [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers];
    const allowedRoles = roles.filter(r => targetRoles.some(t => t === r.roleType));
    if (allowedRoles.length === 0) {
        await respond(m, `There are no valid roles for this tournament. Please add ${targetRoles.map(t => t.toString()).join(", ")} roles first.`);
        return;
    }
    const member = await t.guild.members.fetch(owner.id);
    const allowed = member.roles.cache.hasAny(...allowedRoles.map(r => r.roleID));
    if (!allowed) {
        await respond(m, "You are not a mappooler or organizer for this tournament.");
        return;
    }

    return { m, creator, tournament, mappoolMap, mappers };
}