import { BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Tournament } from "./tournament";
import { TeamInvite } from "./teamInvite";
import { Matchup } from "./matchup";
import { Team as TeamInterface, TeamMember } from "../../Interfaces/team";
import { BaseTournament } from "../../Interfaces/tournament";
import { ModeDivisionType } from "../MCA_AYIM/modeDivision";

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

    @Column({ type: "int", default: 0 })
        timezoneOffset!: number;

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

    public async calculateStats (modeID: ModeDivisionType = 1) {
        if (modeID === ModeDivisionType.storyboard)
            return false;

        try {
            const userStatistics = await Promise.all(this.members.map(member => member.refreshStatistics(modeID)));

            const BWS = userStatistics.reduce((acc, cur) => acc + cur!.BWS, 0);
            const pp = userStatistics.reduce((acc, cur) => acc + cur!.pp, 0);
            const rank = userStatistics.reduce((acc, cur) => acc + cur!.rank, 0);

            this.BWS = BWS / (this.members.length || 1);
            this.pp = pp / (this.members.length || 1);
            this.rank = rank / (this.members.length || 1);

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
            timezoneOffset: this.timezoneOffset,
            avatarURL: this.avatarURL || undefined,
            manager: {
                ID: this.manager.ID,
                username: this.manager.osu.username,
                osuID: this.manager.osu.userID,
                BWS: this.manager.userStatistics?.find(s => s.modeDivision.ID === 1)?.BWS ?? 0,
                isManager: true,
            },
            members: this.members.map<TeamMember>(member => {
                return {
                    ID: member.ID,
                    username: member.osu.username,
                    osuID: member.osu.userID,
                    BWS: member.userStatistics?.find(s => s.modeDivision.ID === 1)?.BWS ?? 0,
                    isManager: member.ID === this.manager.ID,
                };
            }),
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