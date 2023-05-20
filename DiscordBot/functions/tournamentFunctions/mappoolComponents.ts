import { ChatInputCommandInteraction, Message } from "discord.js";
import { tournamentSearchConditions } from "../dbFunctions/getTournaments";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";
import getTournament from "./getTournament";
import getMappool from "./getMappool";
import respond from "../respond";
import getMappoolSlot from "./getMappoolSlot";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { MappoolSlot } from "../../../Models/tournaments/mappools/mappoolSlot";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";

type TournamentOnly = { tournament: Tournament };
type TournamentAndMappool = { tournament: Tournament, mappool: Mappool };
type TournamentMappoolAndSlotMod = { tournament: Tournament, mappool: Mappool, slotMod: MappoolSlot };
type AllComponents = { tournament: Tournament, mappool: Mappool, slotMod: MappoolSlot, mappoolMap: MappoolMap, mappoolSlot: string };

type MappoolComponents = TournamentOnly | TournamentAndMappool | TournamentMappoolAndSlotMod | AllComponents;

export default async function mappoolComponents(
    m: Message | ChatInputCommandInteraction, 
    pool?: string, 
    slot?: string,
    order?: number,
    checkPublic?: boolean,
    tournamentText?: string,
    tournamentSearchType?: keyof typeof tournamentSearchConditions,
    tournamentStatusFilters?: TournamentStatus[],
    getStageRound?: boolean,
    getJobPosts?: boolean
): Promise<undefined | MappoolComponents> {
    let [tournament, mappool, slotMod, mappoolMap, mappoolSlot]: [Tournament?, Mappool?, MappoolSlot?, MappoolMap?, string?] = [];
    
    // Get tournament
    tournament = await getTournament(m, tournamentText, tournamentSearchType, tournamentStatusFilters, getStageRound);
    if (!tournament)
        return;

    if (!pool)
        return { tournament };

    // Get mappool
    mappool = await getMappool(m, tournament, pool, false, slot !== undefined);
    if (!mappool) 
        return;
    if (checkPublic && mappool.isPublic) {
        await respond(m, `Mappool **${mappool.name}** is public. You cannot use this command. Please make the mappool private first.`);
        return;
    }

    if (!slot)
        return { tournament, mappool };

    // Get slotMod
    slotMod = await getMappoolSlot(m, mappool, slot, false, order !== undefined, getJobPosts);
    if (!slotMod) 
        return;

    if (order === undefined)
        return { tournament, mappool, slotMod };

    // Get mappoolMap
    mappoolMap = slotMod.maps.find(m => m.order === order);
    if (!mappoolMap) {
        await respond(m, `Could not find map **${slot}**`);
        return;
    }

    // Get mappoolSlot
    mappoolSlot = `${mappool.abbreviation.toUpperCase()} ${slot}${order}`;

    return { tournament, mappool, slotMod, mappoolMap, mappoolSlot };
}
