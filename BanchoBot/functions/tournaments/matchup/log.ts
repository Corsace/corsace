import { Matchup } from "../../../../Models/tournaments/matchup";

export function log (matchup: Matchup, message: string) {
    console.log(`[Matchup ${matchup.ID}] ${message}`);
}