import { Next, ParameterizedContext } from "koa";
import { Team } from "../../../../Models/tournaments/team";

export function validateTeam (isManager?: boolean, invites?: boolean) {
    return async function (ctx: ParameterizedContext, next: Next) {
        const ID = ctx.request.body?.ID || ctx.params?.teamID || ctx.query.ID || ctx.query.teamID;

        if (ID === undefined || isNaN(parseInt(ID)) || parseInt(ID) < 1) {
            ctx.body = {
                success: false,
                error: "Missing ID",
            };
            return;
        }

        const teamQ = Team
            .createQueryBuilder("team")
            .leftJoinAndSelect("team.manager", "manager")
            .leftJoinAndSelect("team.members", "member");

        if (invites)
            teamQ.leftJoinAndSelect("team.invites", "invite");
            
        const team = await teamQ
            .where("team.ID = :ID", { ID })
            .getOne();

        if (!team) {
            ctx.body = {
                success: false,
                error: "Team not found",
            };
            return;
        }

        if (isManager && team.manager.ID !== ctx.state.user.ID) {
            ctx.body = {
                success: false,
                error: "You are not the manager of this team",
            };
            return;
        }
        if (!isManager && !team.members.find(member => member.ID === ctx.state.user.ID)) {
            ctx.body = {
                success: false,
                error: "You are not a member of this team",
            };
            return;
        }

        ctx.state.team = team;

        await next();
    };
}