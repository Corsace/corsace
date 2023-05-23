import { ChatInputCommandInteraction, Message } from "discord.js";
import { tournamentSearchConditions } from "../dbFunctions/getTournaments";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";
import getTournament from "./getTournament";
import getMappool from "./getMappool";
import getMappoolSlot from "./getMappoolSlot";
import getStage from "./getStage";
import getStaff from "./getStaff";
import respond from "../respond";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { MappoolSlot } from "../../../Models/tournaments/mappools/mappoolSlot";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";
import { User } from "../../../Models/user";
import { TournamentRoleType } from "../../../Models/tournaments/tournamentRole";
import { Stage } from "../../../Models/tournaments/stage";

type optionalComponents = { stage?: Stage, staff?: User };
type TournamentOnly = { tournament: Tournament };
type TournamentAndMappool = { tournament: Tournament, mappool: Mappool };
type TournamentMappoolAndSlotMod = { tournament: Tournament, mappool: Mappool, slotMod: MappoolSlot };
type TournamentMappoolSlotModAndMap = { tournament: Tournament, mappool: Mappool, slotMod: MappoolSlot, mappoolMap: MappoolMap, mappoolSlot: string };
type AllComponents = { tournament: Tournament, mappool: Mappool, slotMod: MappoolSlot, mappoolMap: MappoolMap, mappoolSlot: string };

export type MappoolComponentsType = (TournamentOnly | TournamentAndMappool | TournamentMappoolAndSlotMod | TournamentMappoolSlotModAndMap | AllComponents) & optionalComponents;

export default async function mappoolComponents(
    m: Message | ChatInputCommandInteraction,
    pool?: string, 
    slot?: string | true,
    map?: number | true,
    checkPublic?: boolean,
    tournamentSearchParameters?: {
        text: string,
        searchType: keyof typeof tournamentSearchConditions,
    },
    tournamentStatusFilters?: TournamentStatus[],
    getStageRound?: boolean,
    staffSearchParameters?: {
        text: string,
        roles: TournamentRoleType[],
    },
    getJobPosts?: boolean
): Promise<undefined | MappoolComponentsType> {
    
    // Get tournament
    const tournament = await getTournament(m, tournamentSearchParameters?.text, tournamentSearchParameters?.searchType, tournamentStatusFilters, getStageRound);
    if (!tournament)
        return;

    let stage: Stage | undefined = undefined;
    if (getStageRound) {
        stage = await getStage(m, tournament);
        if (!stage)
            return;
    }

    // Get staff
    let staff: User | undefined = undefined;
    if (staffSearchParameters) {
        staff = await getStaff(m, tournament, staffSearchParameters.text, staffSearchParameters.roles);
        if (!staff)
            return;
    }

    if (!pool)
        return { tournament, stage, staff };

    // Get mappool
    const mappool = await getMappool(m, tournament, pool, false, slot !== undefined, slot !== undefined && map !== undefined);
    if (!mappool) 
        return;
    if (checkPublic && mappool.isPublic) {
        await respond(m, `Mappool **${mappool.name}** is public. You cannot use this command. Please make the mappool private first.`);
        return;
    }

    if (typeof slot !== "string")
        return { tournament, mappool };

    // Get slotMod
    const slotMod = await getMappoolSlot(m, mappool, slot, false, map !== undefined, getJobPosts);
    if (!slotMod) 
        return;

    if (typeof map !== "number")
        return { tournament, mappool, slotMod };

    // Get mappoolMap
    const mappoolMap = slotMod.maps.find(m => m.order === map);
    if (!mappoolMap) {
        await respond(m, `Could not find map **${slot}**`);
        return;
    }

    // Get mappoolSlot
    const mappoolSlot = `${mappool.abbreviation.toUpperCase()} ${slot}${map}`;

    return { tournament, mappool, slotMod, mappoolMap, mappoolSlot, staff, stage };
}
