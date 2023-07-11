import Router from "@koa/router";
import { Tournament } from "../../../../Models/tournaments/tournament";

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
        .leftJoinAndSelect("roundMappools.slots", "roundSlots")
        .leftJoinAndSelect("roundSlots.maps", "roundMaps")
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

export default tournamentRouter;