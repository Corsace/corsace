import { BaseEntity, Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
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
    allowedMods?: number;

    @OneToMany(() => MappoolMap, poolMap => poolMap.slot)
    maps!: MappoolMap[];

}