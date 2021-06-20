import { BaseEntity, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappool";
import { TournamentBracket } from "./tournamentBracket";

@Entity()
export class Tournament extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;
    
    @OneToMany(() => TournamentBracket, bracket => bracket.tournament)
    brackets!: TournamentBracket[];

    @OneToMany(() => Mappool, mappool => mappool.tournament)
    mappools!: Mappool[];
}