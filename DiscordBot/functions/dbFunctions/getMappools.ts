import { Brackets } from "typeorm";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { Tournament } from "../../../Models/tournaments/tournament";

export default function getMappools (tournament: Tournament, poolText = "", getStageRound = false, getSlots = false, getMaps = false) {
    const mappoolQ = Mappool.createQueryBuilder("mappool");

    if (getStageRound) {
        mappoolQ.leftJoinAndSelect("mappool.stage", "stage");
        mappoolQ.leftJoinAndSelect("mappool.round", "round");
    } else
        mappoolQ.leftJoin("mappool.stage", "stage");

    if (getSlots) {
        mappoolQ.leftJoinAndSelect("mappool.slots", "slot");
        mappoolQ.leftJoinAndSelect("slot.maps", "mappoolMap");
        if (getMaps) {
            mappoolQ.leftJoinAndSelect("mappoolMap.customBeatmap", "customBeatmap");
            mappoolQ.leftJoinAndSelect("mappoolMap.customMappers", "customMapper");
            mappoolQ.leftJoinAndSelect("mappoolMap.testplayers", "testplayer");
            mappoolQ.leftJoinAndSelect("mappoolMap.jobPost", "jobPost");
            mappoolQ.leftJoinAndSelect("mappoolMap.beatmap", "beatmap");
            mappoolQ.leftJoinAndSelect("beatmap.beatmapset", "beatmapset");
            mappoolQ.leftJoinAndSelect("customBeatmap.mode", "mode");
        }
    }

    return mappoolQ
        .where("stage.tournament = :tournament")
        .andWhere(new Brackets(qb => {
            if (poolText.length <= 4)
                qb.where("mappool.abbreviation LIKE :criteria");
            else
                qb.where("mappool.name LIKE :criteria");
        }))
        .setParameters({
            tournament: tournament.ID,
            criteria: `%${poolText}%`,
        })
        .getMany();
}