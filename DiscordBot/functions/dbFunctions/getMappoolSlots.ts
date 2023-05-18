import { Brackets } from "typeorm";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { MappoolSlot } from "../../../Models/tournaments/mappools/mappoolSlot";

export default function getMappoolSlots (mappool: Mappool, slot: string = "", getRelations: boolean = false) {
    const mappoolSlotQ = MappoolSlot.createQueryBuilder("slot")
    if (getRelations) {
        mappoolSlotQ
            .leftJoinAndSelect("slot.mappool", "mappool")
            .leftJoinAndSelect("slot.maps", "maps")
            .leftJoinAndSelect("maps.beatmap", "beatmap")
            .leftJoinAndSelect("beatmap.beatmapset", "beatmapset")
            .leftJoinAndSelect("maps.customMappers", "customMappers")
            .leftJoinAndSelect("maps.testplayers", "testplayers")
            .leftJoinAndSelect("maps.customBeatmap", "customBeatmap")
            .leftJoinAndSelect("customBeatmap.mode", "mode")
            .leftJoinAndSelect("maps.jobPost", "jobPost")
    } else {
        mappoolSlotQ
            .leftJoin("slot.mappool", "mappool")
    }

    return mappoolSlotQ
        .where("mappool.ID = :mappool")
        .andWhere(new Brackets(qb => {
            qb.where("slot.name LIKE :criteria")
                .orWhere("slot.acronym LIKE :criteria");
        }))
        .setParameters({
            mappool: mappool.ID,
            criteria: `%${slot}%`,
        })
        .getMany();
}