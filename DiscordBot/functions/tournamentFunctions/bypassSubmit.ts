import { GuildMemberRoleManager } from "discord.js";
import { TournamentRole, TournamentRoleType } from "../../../Models/tournaments/tournamentRole";
import { Tournament } from "../../../Models/tournaments/tournament";

export default async function bypassSubmit (memberRoles: GuildMemberRoleManager, tournament: Tournament) {
    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const bypassRoleFilter = roles.filter(role => role.roleType === TournamentRoleType.Organizer || role.roleType === TournamentRoleType.Mappoolers);
    return bypassRoleFilter.length > 0 && memberRoles.cache.hasAny(...bypassRoleFilter.map(r => r.roleID));
}