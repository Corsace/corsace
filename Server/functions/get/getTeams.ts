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

export default async function getTeams (target: (string | number)[], searchType: (keyof typeof teamSearchConditions)[], getInvites?: boolean, getTournaments?: boolean) {
    const teamQ = Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member");

    if (getInvites)
        teamQ.leftJoinAndSelect("team.invites", "invite");

    if (getTournaments)
        teamQ.leftJoinAndSelect("team.tournaments", "tournament");

    if (target.length === 0 || searchType.length === 0 || target.length !== searchType.length)
        return [];
        
    for (let i = 0; i < target.length; i++)
        if (searchType[i] === "name")
            teamQ.andWhere(teamSearchConditions.name(target[i]), { target: `%${target[i]}%` });
        else if (searchType[i] === "memberCorsaceID" || searchType[i] === "memberDiscordID") {
            const type = searchType[i] as "memberCorsaceID" | "memberDiscordID";
            teamQ.andWhere(teamSearchConditions[type](), { target: target[i] });
        } else
            teamQ.andWhere(teamSearchConditions[searchType[i]], { target: target[i] });

    return teamQ.getMany();
}