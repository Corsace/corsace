import Router from "@koa/router";
import { MatchupList } from "../../../../Interfaces/matchup";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Stage } from "../../../../Models/tournaments/stage";
import { Team } from "../../../../Models/tournaments/team";
import { validateStageOrRound } from "../../../middleware/tournament";

const stageRouter = new Router();

stageRouter.get("/:stageID/matchups", validateStageOrRound, async (ctx) => {
    const stage: Stage = ctx.state.stage;

    const matchups = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("matchup.teams", "teams")
        .where("stage.ID = :stageID", { stageID: stage.ID })
        .getMany();

    ctx.body = {
        success: true,
        matchups: matchups.map<MatchupList>((matchup) => {
            const teams: Team[] = [];
            if (matchup.team1)
                teams.push(matchup.team1);
            if (matchup.team2)
                teams.push(matchup.team2);
            if (matchup.teams)
                teams.push(...matchup.teams);

            return {
                ID: matchup.ID,
                date: matchup.date,
                mp: matchup.mp,
                vod: matchup.vod,
                teams: teams.map((team) => {
                    return {
                        ID: team.ID,
                        name: team.name,
                        avatarURL: team.avatarURL,
                        pp: team.pp,
                        rank: team.rank,
                        BWS: team.BWS,
                        members: [],
                    };
                }),
            };
        }),
    };
});

export default stageRouter;