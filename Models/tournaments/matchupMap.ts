import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MapStatus } from "../../Interfaces/matchup";
import { MappoolMap } from "./mappools/mappoolMap";
import { MatchupScore } from "./matchupScore";
import { MatchupSet } from "./matchupSet";
import { Team } from "./team";

@Entity()
export class MatchupMap extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @ManyToOne(() => MappoolMap, map => map.matchMaps, {
        nullable: false,
    })
        map!: MappoolMap;

    @Column({ type: "enum", enum: MapStatus, default: MapStatus.Picked })
        status!: MapStatus;

    @Column()
        order!: number;

    @OneToMany(() => MatchupScore, score => score.map)
        scores?: MatchupScore[];

    // TODO: yeet this
    @ManyToOne(() => Team, team => team.wins)
        winner?: Team | null;

    @ManyToOne(() => MatchupSet, set => set.maps, {
        nullable: false,
    })
        set!: MatchupSet;

}
