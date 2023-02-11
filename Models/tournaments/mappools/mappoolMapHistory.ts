import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MappoolMap } from "./mappoolMap";

@Entity()
export class MappoolMapHistory extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => MappoolMap, mappoolMap => mappoolMap.history)
    mappoolMap!: MappoolMap;

    @Column()
    link!: string;

}