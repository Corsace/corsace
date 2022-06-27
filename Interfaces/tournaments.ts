import { Phase } from "../Models/phase";

export interface TournamentInfo {
    year: number;
    name: string;
    size: number;
    teamSize: string;
    registration: Phase;
    usesSets: boolean;
    invitational: boolean;
    currentTeamCount: number;
}