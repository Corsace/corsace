import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Matchup } from "./matchup";
import { MatchupMap } from "./matchupMap";
import { Team } from "./team";

@Entity()
export class MatchupSet extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @ManyToOne(() => Matchup, matchup => matchup.sets)
        matchup?: Matchup | null;

    @OneToMany(() => MatchupMap, map => map.set)
        maps?: MatchupMap[] | null;

    @Column({ type: "int", default: 0 })
        team1Score!: number;

    @Column({ type: "int", default: 0 })
        team2Score!: number;

    @ManyToOne(() => Team, team => team.setsFirst)
        first?: Team | null;

    @ManyToOne(() => Team, team => team.setWins)
        winner?: Team | null;

}