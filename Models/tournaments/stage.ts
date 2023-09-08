import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Phase } from "../phase";
import { Round } from "./round";
import { Mappool } from "./mappools/mappool";
import { Tournament } from "./tournament";
import { User } from "../user";
import { Matchup } from "./matchup";
import { MapOrder } from "./mapOrder";
import { ScoringMethod, StageType } from "../../Interfaces/stage";

export const leniencyTime = 10 * 1000;

@Entity()
export class Stage extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;
    
    @CreateDateColumn()
        createdAt!: Date;

    @ManyToOne(() => User, user => user.stagesCreated)
        createdBy!: User;

    @Column()
        name!: string;

    @Column()
        abbreviation!: string;

    @Column()
        order!: number;

    @Column({ type: "enum", enum: StageType, default: StageType.Doubleelimination })
        stageType!: StageType;

    @Column({ type: "enum", enum: ScoringMethod, default: ScoringMethod.ScoreV2 })
        scoringMethod!: ScoringMethod;

    @Column("boolean", { nullable: true })
        isDraft?: boolean | null;

    @Column("boolean", { nullable: true })
        qualifierTeamChooseOrder?: boolean | null;

    @Column("boolean", { default: true })
        publicScores!: boolean;

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

    @OneToMany(() => Matchup, matchup => matchup.stage)
        matchups!: Matchup[];

    @OneToMany(() => MapOrder, mapOrder => mapOrder.stage)
        mapOrder?: MapOrder[] | null;

}