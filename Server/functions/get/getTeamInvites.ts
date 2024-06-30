import { TeamInvite } from "../../../Models/tournaments/teamInvite";

export const inviteSearchConditions = {
    "teamID": "team.ID = :target",
    "userID": "user.ID = :target",
};

export default async function getTeamInvites (target: string | number, searchType: keyof typeof inviteSearchConditions, target2?: string | number, searchType2?: keyof typeof inviteSearchConditions, getMembers?: boolean, getTournaments?: boolean, getRoles?: boolean, getCaptain?: boolean) {
    const inviteQ = TeamInvite
        .createQueryBuilder("invite")
        .innerJoinAndSelect("invite.team", "team")
        .innerJoinAndSelect("invite.user", "user");

    if (getMembers) {
        inviteQ.leftJoinAndSelect("team.members", "member");
        inviteQ.leftJoinAndSelect("member.userStatistics", "stats");
        inviteQ.leftJoinAndSelect("stats.modeDivision", "statMode");
    }

    if (getTournaments)
        inviteQ.leftJoinAndSelect("team.tournaments", "tournament");

    if (getRoles)
        inviteQ.leftJoinAndSelect("tournament.roles", "role");

    if (getCaptain)
        inviteQ.leftJoinAndSelect("team.captain", "captain");
        
    inviteQ.where(inviteSearchConditions[searchType], { target: target });

    // If a second target and search type are provided, add another condition to the WHERE clause
    if (target2 !== undefined && searchType2 !== undefined)
        inviteQ.andWhere(inviteSearchConditions[searchType2].replace(":target", ":target2"), { target2: target2 });

    return inviteQ.getMany();
}