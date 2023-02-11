import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappools/mappool";
import { Stage } from "./stage";

@Entity()
export class Round extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @ManyToOne(() => Stage, stage => stage.rounds)
    stage!: Stage;

    @OneToOne(() => Mappool, mappool => mappool.round)
    @JoinColumn()
    mappool!: Mappool;

}