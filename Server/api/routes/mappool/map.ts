import { CorsaceRouter } from "../../../corsaceRouter";
import { createHash } from "crypto";
import { Beatmap, Mode } from "nodesu";
import { applyMods, modsToAcronym } from "../../../../Interfaces/mods";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { osuClient } from "../../../osu";
import { filterAllowedMods } from "../../../functions/tournaments/mappool/stageAndRoundApi";

const mappoolMapRouter  = new CorsaceRouter();

mappoolMapRouter.$get("/", (ctx) => {
    ctx.body = {
        success: true,
    };
});

mappoolMapRouter.$get<{ mappoolMap: MappoolMap }>("/:mapName", async (ctx) => {
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
                success: false,
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
            success: false,
            error: "Invalid tournament",
        };
        return;
    }

    const slot = ctx.params.mapName.substring(0, ctx.params.mapName.length - 1).toUpperCase();
    const order = parseInt(ctx.params.mapName.substring(ctx.params.mapName.length - 1));

    if (isNaN(order)) {
        ctx.body = {
            success: false,
            error: "Invalid map name",  
        };
        return;
    }

    let mappoolID: number | null = null;
    if (ctx.query.mappoolID && !isNaN(parseInt(ctx.query.mappoolID as string)))
        mappoolID = parseInt(ctx.query.mappoolID as string);

    const mappoolMapQ = MappoolMap
        .createQueryBuilder("mappoolMap")
        .leftJoinAndSelect("mappoolMap.beatmap", "beatmap")
        .leftJoinAndSelect("beatmap.beatmapset", "beatmapset")
        .leftJoinAndSelect("beatmapset.creator", "creator")
        .leftJoinAndSelect("mappoolMap.customBeatmap", "customBeatmap")
        .leftJoinAndSelect("mappoolMap.replay", "replay")
        .leftJoinAndSelect("replay.createdBy", "replayUser")
        .leftJoinAndSelect("mappoolMap.customMappers", "customMappers")
        .innerJoinAndSelect("mappoolMap.slot", "slot")
        .innerJoinAndSelect("slot.mappool", "mappool")
        .innerJoin("mappool.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .where("slot.acronym LIKE :slot", { slot: `%${slot}%` })
        .andWhere("mappoolMap.order = :order", { order })
        .andWhere("tournament.ID = :ID", { ID: tournament.ID });

    if (mappoolID)
        mappoolMapQ.andWhere("mappool.ID = :mappoolID", { mappoolID });
    else
        mappoolMapQ.andWhere("stage.stageType = '0'");

    const mappoolMap = await mappoolMapQ.getOne();

    if (!mappoolMap) {
        ctx.body = {
            success: false,
            error: "Invalid map name",
        };
        return;
    }

    if (!showPrivate && !mappoolMap.slot.mappool.isPublic) {
        ctx.body = {
            success: false,
            error: "This mappool is private",
        };
        return;
    }

    if (mappoolMap.slot.allowedMods && mappoolMap.beatmap) {
        const allowedMods = filterAllowedMods(mappoolMap.slot.allowedMods);
        const set = await osuClient.beatmaps.getByBeatmapId(mappoolMap.beatmap.ID, Mode.all, undefined, undefined, allowedMods) as Beatmap[];
        if (set.length === 0)
            return;

        const beatmap = applyMods(set[0], modsToAcronym(allowedMods));
        mappoolMap.beatmap.totalLength = beatmap.totalLength;
        mappoolMap.beatmap.totalSR = beatmap.difficultyRating;
        mappoolMap.beatmap.circleSize = beatmap.circleSize;
        mappoolMap.beatmap.overallDifficulty = beatmap.overallDifficulty;
        mappoolMap.beatmap.approachRate = beatmap.approachRate;
        mappoolMap.beatmap.hpDrain = beatmap.hpDrain;
        mappoolMap.beatmap.beatmapset.BPM = beatmap.bpm;
    }

    ctx.body = {
        success: true,
        mappoolMap,
    };
});

export default mappoolMapRouter;