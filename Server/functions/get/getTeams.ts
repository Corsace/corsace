import { Brackets } from "typeorm";
import { Team } from "../../../Models/tournaments/team";

export const teamSearchConditions = {
    "ID": "team.ID = :target",
    "captainID": "captain.ID = :target",
    "memberID": () => new Brackets(qb => {
        qb.where("member.ID = :target")
            .orWhere("captain.ID = :target");
    }),
    "name": (target: string | number) => {
        if (target.toString().length <= 4)
            return "team.abbreviation LIKE :target";
        else
            return "team.name LIKE :target";
    },
};

export default async function getTeams (target: string | number, searchType: keyof typeof teamSearchConditions, getInvites?: boolean, getTournaments?: boolean) {
    const teamQ = Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.captain", "captain")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "statMode");

    if (getInvites)
        teamQ.leftJoinAndSelect("team.invites", "invite");

    if (getTournaments)
        teamQ.leftJoinAndSelect("team.tournaments", "tournament");
        
    if (searchType === "name")
        teamQ.andWhere(teamSearchConditions.name(target), { target: `%${target}%` });
    else if (searchType === "memberID")
        teamQ.andWhere(teamSearchConditions[searchType](), { target: target });
    else
        teamQ.andWhere(teamSearchConditions[searchType], { target: target });

    return teamQ.getMany();
}