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

    @Column()
        BWS!: number;

    @Column()
        rank!: number;

    public async calculateBWS () {
        this.BWS = await this.members.reduce(async (acc, member) => (await acc) + (await member.getBWS()), Promise.resolve(0));

        await this.save();
    }
}