import Router from "@koa/router";
import { createHash } from "crypto";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { Tournament } from "../../../../Models/tournaments/tournament";

const mappoolMapRouter = new Router();

mappoolMapRouter.get("/", async (ctx) => {
    ctx.body = {
        success: true,
    };
});

mappoolMapRouter.get("/:mapName", async (ctx) => {
    let showPrivate = false;
    let tournament: Tournament | null = null;
    if (ctx.query.key) {
        showPrivate = true;
        const hash = createHash("sha512");
        hash.update(ctx.query.key as string);
        const hashedKey = hash.digest("hex");
        tournament = await Tournament
            .createQueryBuilder("tournament")
            .where("tournament.key = :key", { key: hashedKey })
            .getOne();
    } else {
        if (!ctx.query.tournamentID) {
            ctx.body = {
                error: "Missing tournamentID",
            };
            return;
        }

        tournament = await Tournament
            .createQueryBuilder("tournament")
            .where("tournament.ID = :ID", { ID: ctx.query.tournamentID })
            .getOne();
    }

    if (!tournament) {
        ctx.body = {
            error: "Invalid tournament",
        };
        return;
    }

    const slot = ctx.params.mapName.substring(0, ctx.params.mapName.length - 1).toUpperCase();
    const order = parseInt(ctx.params.mapName.substring(ctx.params.mapName.length - 1));

    if (isNaN(order)) {
        ctx.body = {
            error: "Invalid map name",  
        };
        return;
    }

    const mappoolMap = await MappoolMap
        .createQueryBuilder("mappoolMap")
        .leftJoinAndSelect("mappoolMap.beatmap", "beatmap")
        .leftJoinAndSelect("beatmap.beatmapset", "beatmapset")
        .leftJoinAndSelect("beatmapset.creator", "creator")
        .innerJoinAndSelect("mappoolMap.slot", "slot")
        .innerJoinAndSelect("slot.mappool", "mappool")
        .innerJoin("mappool.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .where("slot.acronym LIKE :slot", { slot: `%${slot}%` })
        .andWhere("mappoolMap.order = :order", { order })
        .andWhere("stage.stageType = '0'") // TODO: Stage ID instead of stageType
        .andWhere("tournament.ID = :ID", { ID: tournament.ID })
        .getOne();

    if (!mappoolMap) {
        ctx.body = {
            error: "Invalid map name",
        };
        return;
    }

    if (!showPrivate && !mappoolMap.slot.mappool.isPublic) {
        ctx.body = {
            error: "This mappool is private",
        };
        return;
    }

    ctx.body = {
        success: true,
        mappoolMap,
    };
});

export default mappoolMapRouter;