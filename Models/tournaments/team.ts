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

    public async calculateStats (modeID = 1) {
        try {
            const memberDatas = await Promise.all(this.members.map(m => m.getOsuAPIV2Data()));
            const pps = memberDatas.map(data => data.statistics.pp);
            const ranks = memberDatas.map(data => data.statistics.global_rank);

            if (ranks.length === 0 || memberDatas.length === 0) {
                this.pp = 0;
                this.rank = 0;
                this.BWS = 0;
                return true;
            }

            this.pp = pps.reduce((acc, rpp) => acc + rpp, 0);
            this.rank = ranks.reduce((acc, rpp) => acc + (rpp || 0), 0) / ranks.length;
            this.BWS = await memberDatas.reduce(async (acc, data) => {
                const memberBWS = Math.pow(data.statistics.global_rank, Math.pow(0.9937, Math.pow((await User.filterBWSBadges(data.badges, modeID)).length, 2)));
                return (await acc) + memberBWS;
            }, Promise.resolve(0)) / memberDatas.length;

            return true;
        } catch (e) {
            this.pp = 0;
            this.rank = 0;
            this.BWS = 0;
            console.log(e);
            return false;
        }
            
    }
}