import { Brackets } from "typeorm";
import { Team } from "../../../Models/tournaments/team";

export const teamSearchConditions = {
    "ID": "team.ID = :target",
    "managerCorsaceID": "manager.ID = :target",
    "managerDiscordID": "manager.discordUserid = :target",
    "memberCorsaceID": () => new Brackets(qb => {
        qb.where("member.ID = :target")
            .orWhere("manager.ID = :target");
    }),
    "memberDiscordID": () => new Brackets(qb => {
        qb.where("member.discordUserid = :target")
            .orWhere("manager.discordUserid = :target");
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
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member");

    if (getInvites)
        teamQ.leftJoinAndSelect("team.invites", "invite");

    if (getTournaments)
        teamQ.leftJoinAndSelect("team.tournaments", "tournament");
        
    if (searchType === "name")
        teamQ.andWhere(teamSearchConditions.name(target), { target: `%${target}%` });
    else if (searchType === "memberCorsaceID" || searchType === "memberDiscordID") {
        const type = searchType as "memberCorsaceID" | "memberDiscordID";
        teamQ.andWhere(teamSearchConditions[type](), { target: target });
    } else
        teamQ.andWhere(teamSearchConditions[searchType], { target: target });

    return teamQ.getMany();
}