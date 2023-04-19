import { BaseEntity, Brackets, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappool";
import { MappoolMap } from "./mappoolMap";

@Entity()
export class MappoolSlot extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => Mappool, mappool => mappool.slots)
    mappool!: Mappool;

    @Column()
    name!: string;

    @Column()
    acronym!: string;

    @Column({ nullable: true })
    colour?: string;

    @Column({ nullable: true })
    allowedMods?: number;

    @OneToMany(() => MappoolMap, poolMap => poolMap.slot)
    maps!: MappoolMap[];

    static search (mappool: Mappool, slot: string = "", getRelations: boolean = false) {
        const q = this.createQueryBuilder("slot")
        if (getRelations) {
            q
                .leftJoinAndSelect("slot.mappool", "mappool")
                .leftJoinAndSelect("slot.maps", "maps")
                .leftJoinAndSelect("maps.beatmap", "beatmap")
                .leftJoinAndSelect("maps.customMappers", "users")
        } else {
            q
                .leftJoin("slot.mappool", "mappool")
                .leftJoin("slot.maps", "maps")
                .leftJoin("maps.beatmap", "beatmap")
                .leftJoin("maps.customMappers", "users")
        }
        return q
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

}