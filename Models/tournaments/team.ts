import { BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Tournament } from "./tournament";
import { TeamInvite } from "./teamInvite";

@Entity()
export class Team extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;

    @Column()
        name!: string;

    @Column()
        abbreviation!: string;

    @ManyToOne(() => User, user => user.teamsManaged)
        manager!: User;

    @ManyToMany(() => User, user => user.teams)
    @JoinTable()
        members!: User[];

    @OneToMany(() => TeamInvite, invite => invite.team)
        invites?: TeamInvite[] | null;

    @ManyToMany(() => Tournament, tournament => tournament.teams)
        tournaments!: Tournament[];

    @Column({ type: "varchar", nullable: true })
        avatarURL?: string | null;

    @Column("double")
        BWS!: number;

    @Column("double")
        rank!: number;

    @Column("double")
        pp!: number;

    public async calculateStats () {
        const rankpp = await Promise.all(this.members.map(m => m.getRankPP()));
        this.pp = rankpp.reduce((acc, rpp) => acc + rpp[0], 0);
        this.rank = rankpp.reduce((acc, rpp) => acc + (rpp[1] || 0), 0) / rankpp.length;
        this.BWS = await this.members.reduce(async (acc, member) => (await acc) + (await member.getBWS()), Promise.resolve(0)) / this.members.length;
    }
}