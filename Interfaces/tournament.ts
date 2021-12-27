import { BracketInfo } from "./bracket";
import { GroupInfo } from "./group";
import { MappoolInfo } from "./mappool";
import { QualifierInfo } from "./qualifier";
import { TeamInfo } from "./team";

interface InternalPhase {
    start: Date;
    end: Date;
}

export interface TournamentInfo { 
    ID: number,
    name: string,
    registration: InternalPhase,
    size: number,
    eligibleTeamSize: number,
    maximumTeamSize: number,
    doubleElim: boolean,
    useBWS: boolean,
    brackets: BracketInfo[],
    groups: GroupInfo[],
    qualifiers: QualifierInfo[],
    mappools: MappoolInfo[],
    teams: TeamInfo[],
}