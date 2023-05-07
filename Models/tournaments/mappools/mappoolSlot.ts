import { BaseEntity, Brackets, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappool";
import { MappoolMap } from "./mappoolMap";
import { User } from "../../user";

@Entity()
export class MappoolSlot extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => User, user => user.mappoolSlotsCreated)
    createdBy!: User;

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

    @Column({ nullable: true })
    userModCount?: number;

    @Column({ nullable: true })
    uniqueModCount?: number;

    @OneToMany(() => MappoolMap, poolMap => poolMap.slot)
    maps!: MappoolMap[];

    static search (mappool: Mappool, slot: string = "", getRelations: boolean = false) {
        const q = this.createQueryBuilder("slot")
        if (getRelations) {
            q
                .leftJoinAndSelect("slot.mappool", "mappool")
                .leftJoinAndSelect("slot.maps", "maps")
                .leftJoinAndSelect("maps.beatmap", "beatmap")
                .leftJoinAndSelect("beatmap.beatmapset", "beatmapset")
                .leftJoinAndSelect("maps.customMappers", "customMappers")
                .leftJoinAndSelect("maps.testplayers", "testplayers")
                .leftJoinAndSelect("maps.customBeatmap", "customBeatmap")
                .leftJoinAndSelect("customBeatmap.mode", "mode")
        } else {
            q
                .leftJoin("slot.mappool", "mappool")
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