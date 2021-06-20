import { BaseEntity, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TournamentBracket } from "./tournamentBracket";

@Entity()
export class Tournament extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;
    
    @OneToMany(() => TournamentBracket, bracket => bracket.tournament, {
        eager: true,
    })
    brackets!: TournamentBracket[];
}