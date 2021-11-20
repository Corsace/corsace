import { reject } from "lodash";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, MoreThan, MoreThanOrEqual } from "typeorm";
import { TeamInfo } from "../../Interfaces/team";
import { UserOpenInfo } from "../../Interfaces/user";
import { User } from "../user";
import { Qualifier } from  "./qualifier";


export const TEAM_ELIGIBLE_AMOUNT = 6;
export const TEAM_FULL_AMOUNT = 8;

@Entity()
export class Team extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ default: Date.now })
    creation!: Date;

    @Column()
    name!: string;

    @Column()
    slug!: string;

    @Column()
    captain!: number;//COULD BE A STRING? AN OBJECT? DUNNO

    @Column({ nullable: true, default: null })
    teamAvatarUrl!: string;

    @Column({ default: 1 })
    membersAmount!: number;

    @Column()
    qualifier!: Date;

    @Column()
    averageBWS!: number;

    @Column({ nullable: true })
    rank!: number | null; //dunno if you are supposed to do this but TS stops crying if u do

    @Column({ nullable: true})
    seed!: "A" | "B" | "C" | "D" | null;

    @OneToMany(() => User, user => user.team, {
        nullable: false,
    })
    members?: User[];

    @Column()
    role!: string;

    @Column({ default: 0 })
    demerits!: number



    public getCaptain = async function(this: Team): Promise<User | null> {
        const user = await User.findOne({ where: {ID: this.captain}})
        if (!user)
            return null;
        // temp
        return user;
    }

    public getMembers = async function(this: Team, allMembers?: User[]): Promise<User[]> {
        return allMembers ? allMembers.filter((m) => m.team && m.team.toString() === this.ID.toString()) : await User.find({ where: {team: this.ID }});
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
        const ratings = await Promise.all(members.map(m => m.osu.getBWS()));
        const prevAvg = this.averageBWS;
    
        ratings.sort((a, b) => a - b);
    
        // If we have more than 4 players, only calculate BWS from middle 4, lean to top middle 4 if odd
        if (ratings.length > 4) {
            if (ratings.length % 2 !== 0)
                ratings.splice(0, 1)
            while (ratings.length > 4) {
                ratings.splice(0,1);
                ratings.splice(ratings.length-1, 1);
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
        this.rank = this.isEligible() ? (await Team
            .createQueryBuilder("team")
            .where(`averageBWS < ${this.averageBWS} AND membersAmount >= ${TEAM_ELIGIBLE_AMOUNT}`)
            .getCount() + 1) : null;
        if(save) {
            await this.save();
            if(oldRank !== this.rank && computeAllRanksOnUpdate)
                await Team.computeRanks();
        }
        return this.rank;
    };
    
    public getInfo = async function(this: Team, populateMembers = false, allMembers: User[]) {
        const info: TeamInfo = {
            ID: this.ID,
            creation: this.creation,
            name: this.name,
            slug: this.slug,
            captain: this.captain as number,
            teamAvatarUrl: this.teamAvatarUrl,
            membersAmount: this.membersAmount,
            isEligible: this.isEligible(),
            isFull: this.isFull(),
            qualifier: await this.getQualifier(),
            averageBWS: this.averageBWS,
            rank: this.rank,
            seed: this.getSeed(),
            role: this.role,
        };
        if(populateMembers) {
            //figure this out later lol
            const memberInfos = (await Promise.all((await this.getMembers(allMembers)).map((member) => member.getInfo(false, false, false)))).sort((a, b) => Math.pow(a.rank, Math.pow(0.9937, Math.pow(a.badges, 2))) - Math.pow(b.rank, Math.pow(0.9937, Math.pow(b.badges, 2))));
            const captainInfos = memberInfos.splice(memberInfos.findIndex((m) => m.ID == this.captain), 1)[0];
            info.members = [captainInfos, ...memberInfos];
        }
        return info;
    };
    

    public isEligible = function(this: Team): boolean {
        return this.membersAmount >= TEAM_ELIGIBLE_AMOUNT;
    };
    
    public isFull = function(this: Team): boolean {
        return this.membersAmount >= TEAM_FULL_AMOUNT;
    };
    
    public getQualifier = async function(this: Team): Promise<Date | null> {
        const qualifier = await Qualifier.findOne({ where: {teams: this.ID } } );
        if (!qualifier)
            return null;
        return qualifier.time;
    };
    
    /*
    public getDiscordRole = function(this: Team): Role {
        return App.instance.discordGuild.roles.resolve(this.role);
    };*/ 
    

    public getSeed = function(this: Team): "A" | "B" | "C" | "D" | null {
        if(!this.isEligible() || !this.rank)
            return null;
        
            return "A";
    }

    public getTeamInvites = async function(this: Team): Promise<TeamInvite[]> {
        return await TeamInvite.find({ where: {
            team: this.ID,
        }});
    }

    public getPendingTeamInvites = async function(this: Team): Promise<TeamInvite[]> {
        return await TeamInvite.find({ where: {
            team: this.ID,
            status: "PENDING",
        }});
    }

    static getEligibleTeams = function(): Promise<Team[]> {
        return Team.find( {where: { membersAmount: MoreThanOrEqual(TEAM_ELIGIBLE_AMOUNT) } } )
    }

    static computeBWS = async function(eligibleTeams?: Team[], save: boolean = true): Promise<Team[]> {
        if (!eligibleTeams)
            eligibleTeams = await Team.getEligibleTeams()
        await Promise.all(eligibleTeams?.map((team) => team.computeBWS(save, false)));
        return eligibleTeams;
    }

    static computeRanks = async function(eligibleTeams?: Team[], save: boolean = true): Promise<Team[]> {
        if(!eligibleTeams) 
            eligibleTeams = await Team.getEligibleTeams()
        await Promise.all(eligibleTeams?.map((team) => team.computeRank(save, false)));
        return eligibleTeams;
    }

}