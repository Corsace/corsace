import { BaseEntity, Check, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, MoreThanOrEqual, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Phase } from "../phase";
import { User } from "../user";
import { Bracket } from "./bracket";
import { Group } from "./group";
import { Qualifier } from "./qualifier";
import { Team } from "./team";

@Entity()
@Check(`"eligibleTeamSize" <= "maximumTeamSize"`)
export class Tournament extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @Column()
    name!: string;

    @Column()
    slug!: string;

    @Column({ type: "year" })
    year!: number;

    @Column(() => Phase)
    registration!: Phase;

    @Column()
    size!: number;

    @Column({ default: false })
    isOpen!: boolean;

    @Column({ default: false })
    isClosed!: boolean;

    @Column({ default: false })
    invitational!: boolean;

    @Column()
    eligibleTeamSize!: number;

    @Column()
    maximumTeamSize!: number;

    @Column({ default: true })
    doubleElim!: boolean;

    @Column({ default: true })
    useBWS!: boolean;

    @Column({ default: false })
    publicQualifiers!: boolean;

    @OneToMany(() => Bracket, bracket => bracket.tournament)
    brackets!: Bracket[];

    @OneToMany(() => Group, group => group.tournament)
    groups!: Group[];

    @OneToMany(() => Qualifier, qualifier => qualifier.tournament)
    qualifiers!: Qualifier[];

    @ManyToMany(() => Team, team => team.tournaments)
    @JoinTable()
    teams!: Team[];

    @ManyToMany(() => User, user => user.tournaments)
    @JoinTable()
    players!: User[];

    @ManyToMany(() => User, user => user.tournamentsRefereed)
    @JoinTable()
    referees!: User[];

    @ManyToMany(() => User, user => user.tournamentsCommentated)
    @JoinTable()
    commentators!: User[];

    @ManyToMany(() => User, user => user.tournamentsMappooled)
    @JoinTable()
    mappoolers!: User[];
    
    static generateCorsaceTournament(data): Promise<Tournament> {
        const tournament = new Tournament;
        tournament.year = data.year;
        tournament.name = `Corsace Open ${data.year}`;
        tournament.slug = `open${data.year}`;

        tournament.isOpen = data.tourney === "open";
        tournament.isClosed = data.tourney === "closed";
        tournament.invitational = data.tourney === "closed";
        tournament.size = data.size;

        tournament.eligibleTeamSize = data.tourney === "open" ? 6 : 1;
        tournament.maximumTeamSize = data.tourney === "open" ? 8 : 1;

        tournament.registration = {
            start: data.registrationStart,
            end: data.registrationEnd,
        };

        return tournament.save();
    }

}