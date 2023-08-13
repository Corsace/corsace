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
        .leftJoinAndSelect("matchup.potentialFor", "potentialFor")
        .where("stage.ID = :stageID", { stageID: stage.ID })
        .andWhere("matchup.invalid = 0")
        .getMany();

    matchups.sort((a, b) => a.ID - b.ID);

    const potentialIDs = new Map<number, number>();

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

            let val = 0;
            if (matchup.potentialFor) {
                const num = potentialIDs.get(matchup.potentialFor.ID);
                if (typeof num === "number")
                    val = num + 1;

                potentialIDs.set(matchup.potentialFor.ID, val);
            }

            return {
                ID: matchup.ID,
                date: matchup.date,
                mp: matchup.mp,
                vod: matchup.vod,
                potential: matchup.potentialFor ? `${matchup.potentialFor.ID}-${String.fromCharCode("A".charCodeAt(0) + val)}` : undefined,
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