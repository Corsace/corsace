import { CorsaceRouter } from "../../../corsaceRouter";
import { TournamentRoundState } from "koa";
import { MatchupList, MatchupScore } from "../../../../Interfaces/matchup";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { validateStageOrRound } from "../../../middleware/tournament";
import { getMappools, getMatchups, getScores } from "../../../functions/tournaments/mappool/stageAndRoundApi";

const roundRouter  = new CorsaceRouter<TournamentRoundState>();

roundRouter.$use("/:roundID", validateStageOrRound);

roundRouter.$get<{ matchups: MatchupList[] }>("/:roundID/matchups", getMatchups);

roundRouter.$get<{ mappools: Mappool[] }>("/:roundID/mappools", getMappools);

roundRouter.$get<{ scores: MatchupScore[] }>("/:roundID/scores", getScores);

export default roundRouter;
