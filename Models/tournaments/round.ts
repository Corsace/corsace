import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MapOrder } from "./mapOrder";
import { Mappool } from "./mappools/mappool";
import { Matchup } from "./matchup";
import { Stage } from "./stage";

@Entity()
export class Round extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column()
        name!: string;

    @Column()
        abbreviation!: string;

    @Column("boolean", { nullable: true })
        isDraft?: boolean | null;
    
    @ManyToOne(() => Stage, stage => stage.rounds)
        stage!: Stage;

    @OneToMany(() => Mappool, mappool => mappool.round)
        mappool!: Mappool[];

    @OneToMany(() => Matchup, matchup => matchup.round)
        matchups!: Matchup[];

    @OneToMany(() => MapOrder, mapOrder => mapOrder.round)
        mapOrder?: MapOrder[] | null;

}