import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, MoreThan, MoreThanOrEqual, ManyToOne, OneToOne } from "typeorm";
import { Match } from "./match";
import { TeamInfo } from "../../Interfaces/team";
import { User } from "../user";
import { MatchBeatmap } from "./matchBeatmap";
import { MatchSet } from "./matchSet";
import { Qualifier } from  "./qualifier";
import { TeamInvitation } from "./teamInvitation";
import { Tournament } from "./tournament";
import { RequestStatus } from "../../Interfaces/requests";

@Entity()
export class Team extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    creation!: Date;

    @Column()
    name!: string;

    @Column()
    slug!: string;

    @OneToOne(() => User, user => user.teamCaptain)
    captain!: User;

    @Column({ nullable: true, default: null })
    teamAvatarUrl!: string;

    @Column({ default: 1 })
    membersAmount!: number;

    @ManyToOne(() => Qualifier, qualifier => qualifier.teams)
    qualifier!: Qualifier;

    @Column()
    averageBWS!: number;

    @Column({ type: "integer", nullable: true })
    rank!: number | null;

    @Column({ type: "char", nullable: true})
    seed!: "A" | "B" | "C" | "D" | null;

    @OneToMany(() => User, user => user.team)
    members!: User[];

    @Column()
    role!: string;

    @Column({ default: 0 })
    demerits!: number;

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

    @OneToMany(() => TeamInvitation, invite => invite.team)
    invitations?: TeamInvitation[]

    public getCaptain = async function(this: Team): Promise<User | null> {
        const user = await User.findOne(this.captain);
        if (!user)
            return null;
        // temp
        return user;
    }

    public getMembers = async function(this: Team, allMembers?: User[]): Promise<User[]> {
        return allMembers ? allMembers.filter((m) => m.team && m.team === this) : await User.find({team: this});
    }

    /*
    public computeDemerits = async function(this: Team, allDemerits?: DemeritReport[]): Promise<number> {
        const teamDemerits = allDemerits ? allDemerits.filter((d) => d.team && d.team.toString() === this.id.toString()) : await DemeritReport.find({team: this});
    
        let demerits = 0;
        if (teamDemerits)
            demerits += teamDemerits.map((report) => report.amount).reduce((a, b) => a + b, 0);
    
        return demerits;
    }; */
    
    public computeBWS = async function(this: Team, save = true, computeRankOnUpdate = true): Promise<number> {
        const members = await this.getMembers();
        const ratings = (await Promise.all(members.map(m => m.getBWS()))).filter(item => item !== undefined) as number[];
        const prevAvg = this.averageBWS;
    
        ratings.sort((a, b) => a - b);
    
        // If we have more than 4 players, only calculate BWS from middle 4, lean to top middle 4 if odd
        if (ratings.length > 4) {
            if (ratings.length % 2 !== 0)
                ratings.splice(0, 1);
            while (ratings.length > 4) {
                ratings.splice(0,1);
                ratings.splice(ratings.length - 1, 1);
            }
        }
    
        this.averageBWS = ratings.reduce((prev, curr) => prev + curr, 0) / ratings.length;
        if(save) {
            await this.save();
            if(prevAvg !== this.averageBWS && computeRankOnUpdate)
                await this.computeRank();
        }
        return this.averageBWS;
    };
    

    public computeRank = async function(this: Team, save = true, computeAllRanksOnUpdate = true): Promise<number | null> {
        const oldRank = this.rank;
        const eligibleamount = this.tournament.getEligibleAmount();
        this.rank = this.isEligible() ? (await Team
            .createQueryBuilder("team")
            .where(`averageBWS < ${this.averageBWS} AND membersAmount >= ${eligibleamount}`)
            .getCount() + 1) : null;
        if(save) {
            await this.save();
            if(oldRank !== this.rank && computeAllRanksOnUpdate)
                await this.tournament.computeRanks();
        }
        return this.rank;
    };
    
    public getInfo = async function(this: Team): Promise<TeamInfo> {
        const info: TeamInfo = {
            ID: this.ID,
            creation: this.creation,
            name: this.name,
            slug: this.slug,
            captain: await this.captain.getInfo(),
            teamAvatarUrl: this.teamAvatarUrl,
            membersAmount: this.membersAmount,
            isEligible: this.isEligible(),
            isFull: this.isFull(),
            qualifier: await this.getQualifier(),
            averageBWS: this.averageBWS,
            rank: this.rank,
            seed: this.getSeed(),
            members: await Promise.all(this.members.map((member) => member.getInfo())),
            role: this.role,
            demerits: this.demerits,
            tournament: await this.tournament.getInfo(),
            matches: this.matches ? await Promise.all(this.matches.map((match) => match.getInfo())) : undefined,
            mapsWon: this.mapsWon ? await Promise.all(this.mapsWon.map((map) => map.getInfo())) : undefined,
            setsWon: this.setsWon ? await Promise.all(this.setsWon.map((set) => set.getInfo())) : undefined,
            matchesWon: this.matchesWon ? await Promise.all(this.matchesWon.map((match) => match.getInfo())) : undefined,
            matchesFirst: this.matchesFirst ? await Promise.all(this.matchesFirst.map((match) => match.getInfo())) : undefined,
        };
        return info;
    };

    public isEligible = function(this: Team): boolean {
        return this.membersAmount >= this.tournament.getEligibleAmount();
    };
    
    public isFull = function(this: Team): boolean {
        return this.membersAmount >= this.tournament.getFullAmount();
    };
    
    public getQualifier = async function(this: Team): Promise<Date | null> {
        const qualifier = await Qualifier.findOne(this.qualifier);
        if (!qualifier)
            return null;
        return qualifier.time;
    };
    
    public getSeed = function(this: Team): "A" | "B" | "C" | "D" | null {
        if(!this.isEligible() || !this.rank)
            return null;
        return "A";
    }

    public getTeamInvites = async function(this: Team): Promise<TeamInvitation[]> {
        return await TeamInvitation.find({ team: this });
    }

    public getPendingTeamInvites = async function(this: Team): Promise<TeamInvitation[]> {
        return await TeamInvitation.find({ team: this, status: RequestStatus.Pending });
    }

}