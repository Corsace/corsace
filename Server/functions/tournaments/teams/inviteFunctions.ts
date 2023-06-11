import { Brackets } from "typeorm";
import { Team } from "../../../../Models/tournaments/team";
import { TeamInvite } from "../../../../Models/tournaments/teamInvite";
import { Tournament, TournamentStatus } from "../../../../Models/tournaments/tournament";
import { User } from "../../../../Models/user";
import getTeamInvites from "../../get/getTeamInvites";

export async function invitePlayer (team: Team, user: User) {
    const existingInvite = await getTeamInvites(team.ID, "teamID", user.ID, "userID");
    if (existingInvite.length > 0 || team.invites?.some(i => i.ID === user?.ID))
        return "User is already invited";

    if (team.members.some(m => m.ID === user?.ID) || team.manager.ID === user?.ID)
        return "User is already in the team";

    const invite = new TeamInvite;
    invite.team = team;
    invite.user = user;

    return invite;
}

export async function inviteAcceptChecks (invite: TeamInvite) {
    const teamTournaments = invite.team.tournaments;
    if (teamTournaments.some(t => t.status === TournamentStatus.Ongoing))
        return "Team is in an ongoing tournament";

    const registrationTournaments = teamTournaments.filter(t => t.status === TournamentStatus.Registrations);
    if (registrationTournaments.some(t => invite.team.members.length + 1 > t.maxTeamSize))
        return "Team is too big for a tournament it's currently registered for";

    const alreadyInTeam = await Tournament
        .createQueryBuilder("tournament")
        .innerJoinAndSelect("tournament.teams", "team")
        .innerJoinAndSelect("team.members", "member")
        .innerJoinAndSelect("team.manager", "manager")
        .where("tournament.ID IN (:...tournaments)", { tournaments: registrationTournaments.map(t => t.ID) })
        .andWhere(new Brackets(qb => {
            qb.where("member.ID = :userID", { userID: invite.user.ID })
                .orWhere("manager.ID = :userID", { userID: invite.user.ID });
        }))
        .getExists();
    if (alreadyInTeam)
        return "User is already in a team for a tournament this team is registered for";

    const team = invite.team;
    if (team.members.length === 16)
        return "Team is full";

    return true;
}