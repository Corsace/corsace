import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MapOrder } from "./mapOrder";
import { Mappool } from "./mappools/mappool";
import { Match } from "./match";
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

    @OneToMany(() => Match, match => match.round)
        matches!: Match[];

    @OneToMany(() => MapOrder, mapOrder => mapOrder.stage)
        mapOrder!: MapOrder[];

}