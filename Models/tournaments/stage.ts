import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Phase } from "../phase";
import { Round } from "./round";
import { Mappool } from "./mappools/mappool";
import { Tournament } from "./tournament";

export enum StageType {
    Qualifiers,
    SingleElimination,
    DoubleElimination,
    RoundRobin,
    Swiss,
}

export enum ScoringMethod {
    ScoreV1,
    ScoreV2,
    Accuracy,
    Combo,
    Count300,
    Count100,
    Count50,
    CountMiss,
}

@Entity()
export class Stage extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;
    
    @CreateDateColumn()
    createdAt!: Date;

    @Column()
    name!: string;

    @Column()
    abbreviation!: string;

    @Column()
    order!: number;

    @Column({ type: "enum", enum: StageType, default: StageType.DoubleElimination })
    stageType!: StageType;

    @Column({ type: "enum", enum: ScoringMethod, default: ScoringMethod.ScoreV2 })
    scoringMethod!: ScoringMethod;

    @Column(() => Phase)
    timespan!: Phase;

    @ManyToOne(() => Tournament, tournament => tournament.stages)
    tournament!: Tournament;

    @OneToMany(() => Round, bracket => bracket.stage)
    rounds!: Round[];

    @OneToMany(() => Mappool, mappool => mappool.stage)
    mappool?: Mappool[];

    @Column({ default: false })
    isFinished!: boolean;

    @Column()
    initialSize!: number;

    @Column()
    finalSize!: number;

}