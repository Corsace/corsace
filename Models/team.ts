import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { TeamInvitation } from "./teamInvitation";
import { Match } from "./tournaments/match";
import { MatchBeatmap } from "./tournaments/matchBeatmap";
import { MatchSet } from "./tournaments/matchSet";
import { Tournament } from "./tournaments/tournament";
import { User } from "./user";

@Entity()
export class Team extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column("varchar", { length: 30 })
    name!: string;

    @CreateDateColumn()
    created!: Date;

    @Column({ nullable: true })
    avatar?: string;

    @Column()
    role!: string;

    @ManyToOne(() => Tournament, tournament => tournament.teams)
    tournament!: Tournament;
    
    @ManyToMany(() => Match, match => match.teamA || match.teamB)
    matches?: Match[];

    @OneToMany(() => MatchBeatmap, map => map.winner)
    mapsWon?: MatchBeatmap[]
    
    @OneToMany(() => MatchSet, set => set.winner)
    setsWon?: MatchSet[]
    
    @OneToMany(() => Match, match => match.winner)
    matchesWon?: Match[]
    
    @OneToMany(() => Match, match => match.first)
    matchesFirst?: Match[]

    @OneToOne(() => User, user => user.teamCaptain)
    @JoinColumn()
    captain!: User;

    @OneToMany(() => User, user => user.team)
    players?: User[];

    @OneToMany(() => TeamInvitation, invitation => invitation.team)
    invitations?: TeamInvitation[];

    @Column({ default: 0 })
    wins!: number;

    @Column({ default: 0 })
    losses!: number;
}