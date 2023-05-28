import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappools/mappool";
import { Stage } from "./stage";

@Entity()
export class Round extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column()
        name!: string;

    @Column()
        abbreviation!: string;

    @ManyToOne(() => Stage, stage => stage.rounds)
        stage!: Stage;

    @OneToMany(() => Mappool, mappool => mappool.round)
        mappool!: Mappool[];

}