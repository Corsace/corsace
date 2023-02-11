import { BaseEntity, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Round } from "../round";
import { Stage } from "../stage";
import { MappoolSlot } from "./mappoolSlot";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @OneToOne(() => Stage, stage => stage.mappool)
    stage?: Stage;

    @OneToOne(() => Round, round => round.mappool)
    round?: Round;

    @OneToMany(() => MappoolSlot, mappoolSlot => mappoolSlot.mappool)
    slots!: MappoolSlot[];

}