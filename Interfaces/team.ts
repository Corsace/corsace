import { User } from "../Models/user";

export interface TeamInfo {
    ID: number;
    creation: Date;
    name: string;
    slug: string;
    captain: User;
    teamAvatarUrl: string;
    membersAmount: number;
    isEligible: boolean;
    isFull: boolean;
    qualifier: Date | null; 
    averageBWS: number;
    rank: number | null;
    seed: "A" | "B" | "C" | "D" | null;
    members?: User[];
    role: string;
}
