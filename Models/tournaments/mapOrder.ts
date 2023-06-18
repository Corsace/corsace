import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MapStatus } from "./matchupMap";
import { Round } from "./round";
import { Stage } from "./stage";

@Entity()
export class MapOrder extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column({ default: 1 })
        set!: number;
    
    @Column()
        order!: number;

    @Column()
        team!: number;

    @ManyToOne(() => Stage, stage => stage.mapOrder)
        stage?: Stage | null;

    @ManyToOne(() => Round, round => round.mapOrder)
        round?: Round | null;

    @Column({ type: "enum", enum: MapStatus, default: MapStatus.Picked })
        status!: MapStatus;
}