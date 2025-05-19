import { CorsaceRouter } from "../../../corsaceRouter";
import { TournamentStageState } from "koa";
import { MatchupList, MatchupScore } from "../../../../Interfaces/matchup";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { validateStageOrRound } from "../../../middleware/tournament";
import { getMappools, getMatchups, getScores } from "../../../functions/tournaments/mappool/stageAndRoundApi";

const stageRouter  = new CorsaceRouter<TournamentStageState>();

stageRouter.$use("/:stageID", validateStageOrRound);

stageRouter.$get<{ matchups: MatchupList[] }>("/:stageID/matchups", getMatchups);

stageRouter.$get<{ mappools: Mappool[] }>("/:stageID/mappools", getMappools);

stageRouter.$get<{ scores: MatchupScore[] }>("/:stageID/scores", getScores);

export default stageRouter;
