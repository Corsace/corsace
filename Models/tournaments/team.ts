import { BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Tournament } from "./tournament";
import { TeamInvite } from "./teamInvite";
import { Matchup } from "./matchup";
import { Team as TeamInterface, TeamMember } from "../../Interfaces/team";
import { BaseTournament } from "../../Interfaces/tournament";

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

    @OneToMany(() => Matchup, matchup => matchup.team1)
        matchupsAsTeam1!: Matchup[];

    @OneToMany(() => Matchup, matchup => matchup.team2)
        matchupsAsTeam2!: Matchup[];

    @OneToMany(() => Matchup, matchup => matchup.first)
        matchupsFirst!: Matchup[];

    @OneToMany(() => Matchup, matchup => matchup.winner)
        wins!: Matchup[];

    @ManyToMany(() => Matchup, matchup => matchup.teams)
        matchupGroup!: Matchup[];

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

            this.pp = pps.reduce((acc, rpp) => acc + rpp, 0) / pps.length;
            this.rank = ranks.reduce((acc, rpp) => acc + (rpp || 0), 0) / ranks.length;
            this.BWS = await memberDatas.reduce(async (acc, data) => {
                const memberBWS = Math.pow(data.statistics.global_rank, Math.pow(0.9937, Math.pow(User.filterBWSBadges(data.badges, modeID).length, 2)));
                return (await acc) + memberBWS;
            }, Promise.resolve(0)) / memberDatas.length;

            return true;
        } catch (e) {
            this.pp = 0;
            this.rank = 0;
            this.BWS = 0;
            console.warn("Error in calculating team stats:\n", e);
            return false;
        }
            
    }

    public async teamInterface (): Promise<TeamInterface> {
        const qualifier = await Matchup
            .createQueryBuilder("matchup")
            .innerJoin("matchup.teams", "team")
            .innerJoin("matchup.stage", "stage")
            .where("team.ID = :teamID", { teamID: this.ID })
            .andWhere("stage.stageType = '0'")
            .getOne();
        const tournaments: BaseTournament[] = this.tournaments?.map(t => ({
            ID: t.ID,
            name: t.name,
        })) || (await Tournament
            .createQueryBuilder("tournament")
            .innerJoin("tournament.teams", "team")
            .where("team.ID = :teamID", { teamID: this.ID })
            .select(["tournament.ID", "tournament.name"])
            .getMany()).map(t => ({
            ID: t.ID,
            name: t.name,
        }));
        return {
            ID: this.ID,
            name: this.name,
            abbreviation: this.abbreviation,
            avatarURL: this.avatarURL || undefined,
            manager: {
                ID: this.manager.ID,
                username: this.manager.osu.username,
                osuID: this.manager.osu.userID,
                BWS: await this.manager.calculateBWS(),
                isManager: true,
            },
            members: await Promise.all(this.members.map<Promise<TeamMember>>(async member => {
                return {
                    ID: member.ID,
                    username: member.osu.username,
                    osuID: member.osu.userID,
                    BWS: await member.calculateBWS(),
                    isManager: member.ID === this.manager.ID,
                };
            })),
            pp: this.pp,
            BWS: this.BWS,
            rank: this.rank,
            tournaments,
            qualifier: qualifier ? {
                ID: qualifier.ID,
                date: qualifier.date,
                mp: qualifier.mp,
            } : undefined,
        };
    }
}