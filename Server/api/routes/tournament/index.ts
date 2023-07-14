import Router from "@koa/router";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { BaseQualifier } from "../../../../Interfaces/qualifier";

const tournamentRouter = new Router();

tournamentRouter.get("/open/:year", async (ctx) => {
    if (await ctx.cashed())
        return;

    const year = parseInt(ctx.params.year);
    if (isNaN(year)) {
        ctx.body = {
            success: false,
            error: "Invalid year",
        };
        return;
    }

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.stages", "stages")
        .leftJoinAndSelect("stages.rounds", "rounds")
        .leftJoinAndSelect("tournament.organizer", "organizer")
        .leftJoinAndSelect("tournament.teams", "team")
        .leftJoinAndSelect("stages.mappool", "mappools")
        .leftJoinAndSelect("rounds.mappool", "roundMappools")
        .leftJoinAndSelect("mappools.slots", "slots")
        .leftJoinAndSelect("slots.maps", "maps")
        .leftJoinAndSelect("maps.beatmap", "beatmaps", "mappools.isPublic = true")
        .leftJoinAndSelect("beatmaps.beatmapset", "beatmapsets")
        .leftJoinAndSelect("beatmapsets.creator", "beatmapsetCreator")
        .leftJoinAndSelect("roundMappools.slots", "roundSlots")
        .leftJoinAndSelect("roundSlots.maps", "roundMaps")
        .leftJoinAndSelect("roundMaps.beatmap", "roundBeatmaps", "roundMappools.isPublic = true")
        .leftJoinAndSelect("roundMaps.customBeatmap", "roundCustomBeatmaps", "roundMappools.isPublic = true")
        .where("tournament.year = :year", { year })
        .andWhere("tournament.isOpen = true")
        .getOne();

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }
    tournament.stages.forEach(stage => {
        stage.rounds.forEach(round => {
            round.mappool.forEach(mappool => {
                if (!mappool.isPublic) {
                    mappool.mappackLink = null;
                    mappool.mappackExpiry = null;
                }
            });
        });
        stage.mappool?.forEach(mappool => {
            if (!mappool.isPublic) {
                mappool.mappackLink = null;
                mappool.mappackExpiry = null;
            }
        });
    });

    ctx.body = tournament;
});

tournamentRouter.get("/qualifiers/:tournamentID", async (ctx) => {
    const ID = parseInt(ctx.params.tournamentID);
    if (isNaN(ID)) {
        ctx.body = {
            success: false,
            error: "Invalid tournament ID",
        };
        return;
    }

    const qualifiers = await Matchup
        .createQueryBuilder("matchup")
        .leftJoin("matchup.teams", "team")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .where("tournament.ID = :ID", { ID })
        .andWhere("stage.stageType = 0")
        .getMany();
    
    ctx.body = qualifiers.map<BaseQualifier>(q => ({
        ID: q.ID,
        date: q.date,
        team: q.teams?.[0] ? {
            name: q.teams[0].name,
            avatarURL: q.teams[0].avatarURL,
        } : undefined,
    }));
});

export default tournamentRouter;