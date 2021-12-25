import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BracketInfo } from "../../Interfaces/bracket";
import { Mappool } from "./mappool";
import { Match } from "./match";
import { Tournament } from "./tournament";

@Entity()
export class Bracket extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @ManyToOne(() => Tournament, tournament => tournament.brackets)
    tournament!: Tournament;

    @OneToOne(() => Mappool, mappool => mappool.bracket)
    @JoinColumn()
    mappool!: Mappool;

    @OneToMany(() => Match, match => match.bracket)
    matches!: Match[];

    public getInfo = async function (this: Bracket): Promise<BracketInfo> {
        const info: BracketInfo = {
            ID: this.ID,
            name: this.name,
            tournament: await this.tournament.getInfo(),
            mappool: await this.mappool.getInfo(),
            matches: await Promise.all(this.matches.map((match) => match.getInfo())),
        };
        return info;
    }
}