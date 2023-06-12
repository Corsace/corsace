import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MappoolMap } from "./mappools/mappoolMap";
import { Match } from "./match";
import { MatchScore } from "./matchScore";
import { Team } from "./team";

export enum MapStatus {
    Protected,
    Banned,
    Picked,
}

@Entity()
export class MatchMap extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @ManyToOne(() => MappoolMap, map => map.matchMaps)
        map!: MappoolMap;

    @Column({ type: "enum", enum: MapStatus, default: MapStatus.Picked })
        status!: MapStatus;

    @Column()
        order!: number;

    @Column({ type: "int", nullable: true })
        team1Score?: number | null;

    @Column({ type: "int", nullable: true })
        team2Score?: number | null;

    @OneToMany(() => MatchScore, score => score.map)
        scores!: MatchScore[];

    @ManyToOne(() => Team, team => team.wins)
        winner!: Team;

    @OneToMany(() => Match, match => match.maps)
        matches!: Match[];
}