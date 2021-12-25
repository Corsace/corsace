import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Phase } from "../phase";
import { Team } from "./team";
import { Mappool } from "./mappool";
import { Bracket } from "./bracket";
import { Group } from "./group";
import { Qualifier } from "./qualifier";
import { TournamentInfo } from "../../Interfaces/tournament";

@Entity()
export class Tournament extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @Column(() => Phase)
    registration!: Phase;

    @Column()
    size!: number;

    @Column({ default: true })
    doubleElim!: boolean;

    @OneToMany(() => Bracket, bracket => bracket.tournament)
    brackets!: Bracket[];

    @OneToMany(() => Group, group => group.tournament)
    groups!: Group[];

    @OneToMany(() => Qualifier, qualifier => qualifier.tournament)
    qualifiers!: Qualifier[];

    @OneToMany(() => Mappool, mappool => mappool.tournament)
    mappools!: Mappool[];

    @OneToMany(() => Team, team => team.tournament)
    teams!: Team[];

    public getInfo = async function(this: Tournament): Promise<TournamentInfo> {
        const info: TournamentInfo = {
            ID: this.ID,
            name: this.name,
            registration: await this.registration.getInfo();
            size: this.size,
            doubleElim: this.doubleElim,
            brackets: await Promise.all(this.brackets.map((bracket) => bracket.getInfo())),
            groups: await Promise.all(this.groups.map((group) => group.getInfo())),
            qualifiers: await Promise.all(this.qualifiers.map((qualifier) => qualifier.getInfo())),
            mappools: await Promise.all(this.mappools.map((mappool) => mappool.getInfo())),
            teams: await Promise.all(this.teams.map((team) => team.getInfo())),
        };
        return info;
    }
}