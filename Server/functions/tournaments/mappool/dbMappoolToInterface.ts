import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { Mappool as MappoolInterface } from "../../../../Interfaces/mappool";

export default function dbMappoolToInterface (dbMappool: Mappool): MappoolInterface {
    return {
        ID: dbMappool.ID,
        name: dbMappool.name,
        abbreviation: dbMappool.abbreviation,
        createdAt: dbMappool.createdAt,
        order: dbMappool.order,
        isPublic: dbMappool.isPublic,
        bannable: dbMappool.bannable,
        mappackLink: dbMappool.mappackLink,
        mappackExpiry: dbMappool.mappackExpiry,
        targetSR: dbMappool.targetSR,
        slots: dbMappool.slots || [],
    };
}