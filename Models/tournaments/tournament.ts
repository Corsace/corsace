import { BaseEntity, Check, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, MoreThanOrEqual, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TournamentInfo } from "../../Interfaces/tournaments";
import { Phase } from "../phase";
import { User } from "../user";
import { Bracket } from "./bracket";
import { Group } from "./group";
import { Match } from "./match";
import { Qualifier } from "./qualifier";
import { Team } from "./team";

@Entity()
@Check(`"minTeamSize" <= "maxTeamSize"`)
export class Tournament extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => User, user => user.tournamentsOrganized)
    organizer!: User;

    @Column()
    name!: string;

    @Column()
    server!: string;

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
    minTeamSize!: number;

    @Column()
    maxTeamSize!: number;

    @Column({ default: false })
    publicQualifiers!: boolean;

    @OneToMany(() => Bracket, bracket => bracket.tournament)
    brackets!: Bracket[];

    @OneToMany(() => Match, match => match.tournament)
    matches!: Match[];

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

    public getInfo = function(this: Tournament): TournamentInfo {
        return {
            year: this.year,
            name: this.name,
            size: this.size,
            isOpen: this.isOpen,
            isClosed: this.isClosed,
            teamSize: this.maximumTeamSize === this.eligibleTeamSize ? `${this.maximumTeamSize}` : `${this.eligibleTeamSize}-${this.maximumTeamSize}`,
            registration: this.registration,
            usesSets: this.usesSets,
            invitational: this.invitational,
            currentTeamCount: this.teams.length,
        };
    }

    public getTeams = async function(this: Tournament): Promise<Team[]> {
        return Team
            .createQueryBuilder("team")
            .leftJoinAndSelect("team.tournaments", "tournament")
            .where("tournament.ID = :id", { id: this.ID })
            .getMany();
    }
    
    static generateCorsaceTournament(data): Promise<Tournament> {
        const tournament = new Tournament;
        tournament.year = data.year;
        tournament.name = `Corsace Open ${data.year}`;
        tournament.slug = `open${data.year}`;

        tournament.usesSets = data.tourney === "open";
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