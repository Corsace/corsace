import Router from "@koa/router";
import { Qualifier } from "../../../Interfaces/qualifier";
import { Matchup } from "../../../Models/tournaments/matchup";

const qualifierRouter = new Router();

qualifierRouter.get("/:qualifierID", async (ctx) => {
    const qualifierID = parseInt(ctx.params.qualifierID);
    if (isNaN(qualifierID)) {
        ctx.body = {
            success: false,
            error: "Invalid qualifier ID",
        };
        return;
    }

    const qualifier = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.referee", "referee")
        .innerJoinAndSelect("matchup.teams", "team")
        .innerJoinAndSelect("team.members", "member")
        .innerJoinAndSelect("matchup.maps", "map")
        .innerJoinAndSelect("map.map", "mappoolMap")
        .innerJoinAndSelect("mappoolMap.slot", "slot")
        .innerJoinAndSelect("map.scores", "score")
        .innerJoinAndSelect("score.user", "user")
        .where("matchup.ID = :qualifierID", { qualifierID })
        .andWhere("stage.stageType = '0'")
        .getOne();

    if (!qualifier) {
        ctx.body = {
            success: false,
            error: "Qualifier not found",
        };
        return;
    }

    const qualifierData: Qualifier = {
        ID: qualifier.ID,
        date: qualifier.date,
        referee: qualifier.referee ? {
            ID: qualifier.referee.ID,
            username: qualifier.referee.osu.username,
        } : undefined,
        team: qualifier.teams?.[0] ? {
            name: qualifier.teams[0].name,
            avatarURL: qualifier.teams[0].avatarURL,
        } : undefined,
        scores: qualifier.maps?.flatMap(m => m.scores?.map(s => ({
            teamID: qualifier.teams!.find(t => t.members.some(m => m.ID === s.user!.ID))!.ID,
            teamName: qualifier.teams!.find(t => t.members.some(m => m.ID === s.user!.ID))!.name,
            username: s.user!.osu.username,
            userID: s.user!.ID,
            score: s.score,
            map: `${m.map!.slot!.acronym}${m.map!.order}`,
            mapID: parseInt(`${m.map!.slot.ID}${m.map!.order}`),
        })) ?? []) ?? [],
    };

    ctx.body = qualifierData;
});

export default qualifierRouter;