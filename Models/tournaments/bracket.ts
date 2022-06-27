import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BracketData, smallRounds } from "../../Interfaces/bracket";
import { Mappool } from "./mappool";
import { Match, MatchGenerator } from "./match";
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
    public async generateBrackets(tournament: Tournament, data: BracketData[]) {
        let size = tournament.size;
        if (Math.log2(size) % 1 !== 0)
            throw new Error("Tournament size must be a power of 2");
        
        const matchGenerator = new MatchGenerator;

        while (size >= (tournament.doubleElim ? 1 : 2)) {
            const bracketData = data.find(d => d.size === size);
            if (!bracketData)
                throw new Error("Bracket data for size " + size + " not found");
            const bracket = new Bracket;
            bracket.name = size > 8 ? `round of ${size}` : smallRounds[size];
            bracket.tournament = tournament;
            await bracket.save();
            if (tournament.size < 8)
                await matchGenerator.generateMatches(tournament, bracket, 2, bracketData.matchSize, bracketData.setSize);
            else if (size > tournament.size / 8)
                await matchGenerator.generateMatches(tournament, bracket, tournament.size / 2, bracketData.matchSize, bracketData.setSize);
            else 
                await matchGenerator.generateMatches(tournament, bracket, tournament.size * 2, bracketData.matchSize, bracketData.setSize);
        }
    }
}