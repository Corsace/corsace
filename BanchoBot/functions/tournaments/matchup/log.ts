import { Matchup } from "../../../../Models/tournaments/matchup";

export default function log (matchup: Matchup, message: string) {
    console.log(`[Matchup ${matchup.ID}] ${message}`);
}