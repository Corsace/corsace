import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MapStatus } from "../../Interfaces/matchup";
import { MapOrderTeam } from "../../Interfaces/stage";
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

    @Column({ type: "enum", enum: MapOrderTeam, default: MapOrderTeam.Team1 })
        team!: MapOrderTeam;

    @ManyToOne(() => Stage, stage => stage.mapOrder)
        stage?: Stage | null;

    @ManyToOne(() => Round, round => round.mapOrder)
        round?: Round | null;

    @Column({ type: "enum", enum: MapStatus, default: MapStatus.Picked })
        status!: MapStatus;
}