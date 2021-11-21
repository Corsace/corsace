import { BracketInfo } from "./bracket";
import { GroupInfo } from "./group";
import { MappoolInfo } from "./mappool";
import { QualifierInfo } from "./qualifier";
import { TeamInfo } from "./team";


export interface TournamentInfo { 
    ID: number,
    name: string,
    registration: PhaseInfo,
    size: number,
    doubleElim: boolean,
    brackets: BracketInfo[],
    groups: GroupInfo[],
    qualifiers: QualifierInfo[],
    mappools: MappoolInfo[],
    teams: TeamInfo[],
}