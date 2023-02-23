import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Round } from "../round";
import { Stage } from "../stage";
import { MappoolSlot } from "./mappoolSlot";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    targetSR!: number;

    @Column()
    order!: number;

    @ManyToOne(() => Stage, stage => stage.mappool)
    stage!: Stage;

    @ManyToOne(() => Round, round => round.mappool)
    round?: Round;

    @OneToMany(() => MappoolSlot, mappoolSlot => mappoolSlot.mappool)
    slots!: MappoolSlot[];

}