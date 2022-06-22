import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
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

}

export class BracketGenerator {
    /**
     * Generates multiple brackets for a given tournament and its size
     */
    public generateBrackets(tournament: Tournament): Bracket[] {
        let size = tournament.size;
        const divCheck = Math.log2(size) % 1 === 0;

        let brackets: Bracket[] = [];
        while (size >= 1) {
            const bracket = new Bracket;
            bracket.name = size > 4 ? divCheck ? `round of ${size}` : `play in` : smallRounds[size];
            bracket.tournament = tournament;
            brackets.push(bracket);
            size /= 2;
        }
        if (tournament.doubleElim) {
            const bracket = new Bracket;
            bracket.name = "grand finals";
            bracket.tournament = tournament;
            brackets.push(bracket);
        }
        return brackets;
    }
}

const smallRounds = {
    4: "quarter finals",
    2: "semi finals",
    1: "finals",
}