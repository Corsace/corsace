import { BaseEntity, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappool";
import { Match } from "./match";
import { Tournament } from "./tournament";

@Entity()
export class Group extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.groups)
    tournament!: Tournament;

    @ManyToOne(() => Mappool, mappool => mappool.groups)
    mappool!: Mappool;

    @OneToMany(() => Match, match => match.group)
    matches!: Match[];

}

export class GroupGenerator {
    /**
     * Generates multiple groups for a given tournament and its size
     */
     public async generateGroups(tournament: Tournament) {
        for (let i = 0; i < tournament.size / 4; i++) {
            const group = new Group();
            group.tournament = tournament;
            await group.save();
        }
    }
}