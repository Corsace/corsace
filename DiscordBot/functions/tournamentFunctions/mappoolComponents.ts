import { ChatInputCommandInteraction, Message } from "discord.js";
import { tournamentSearchConditions } from "../../../Server/functions/get/getTournaments";
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
import { Stage } from "../../../Models/tournaments/stage";
import { TournamentRoleType } from "../../../Interfaces/tournament";

interface optionalComponents { stage?: Stage, staff?: User }
interface TournamentOnly { tournament: Tournament }
interface TournamentAndMappool { tournament: Tournament, mappool: Mappool }
interface TournamentMappoolAndSlotMod { tournament: Tournament, mappool: Mappool, slotMod: MappoolSlot }
interface AllComponents { tournament: Tournament, mappool: Mappool, slotMod: MappoolSlot, mappoolMap: MappoolMap, mappoolSlot: string }

export type MappoolComponentsType = (TournamentOnly | TournamentAndMappool | TournamentMappoolAndSlotMod | AllComponents) & optionalComponents;

export default async function mappoolComponents (
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
    getJobPosts?: boolean,
    getReplays?: boolean
): Promise<undefined | MappoolComponentsType> {
    
    // Get tournament
    const tournament = await getTournament(m, tournamentSearchParameters?.text, tournamentSearchParameters?.searchType, tournamentStatusFilters, getStageRound);
    if (!tournament)
        return;

    let stage: Stage | undefined = undefined;
    if (getStageRound) {
        stage = await getStage(m, tournament, false, pool ?? tournament.ID, pool ? "name" : "tournamentID");
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
    const mappool = await getMappool(m, tournament, pool, getStageRound, slot !== undefined, slot !== undefined && map !== undefined);
    if (!mappool) 
        return;
    if (checkPublic && mappool.isPublic) {
        await respond(m, `**${mappool.name}** is public so u can't use this command. Make the mappool private first`);
        return;
    }

    if (typeof slot !== "string")
        return { tournament, mappool, stage, staff };

    // Get slotMod
    const slotMod = await getMappoolSlot(m, mappool, slot, false, map !== undefined, getJobPosts, getReplays);
    if (!slotMod) 
        return;

    if (typeof map !== "number" && slotMod.maps.length > 1)
        return { tournament, mappool, slotMod, stage, staff };

    // Get mappoolMap
    const mappoolMap = map === true ? slotMod.maps[0] : slotMod.maps.find(m => m.order === map);
    if (!mappoolMap) {
        await respond(m, `Can't find **${slot}${slotMod.maps.length === 1 ? "" : map}**`);
        return;
    }

    // Get mappoolSlot
    const mappoolSlot = `${mappool.abbreviation.toUpperCase()} ${slot}${slotMod.maps.length === 1 ? "" : map}`;

    return { tournament, mappool, slotMod, mappoolMap, mappoolSlot, staff, stage };
}
