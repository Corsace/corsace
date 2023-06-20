import { Next, ParameterizedContext } from "koa";
import getTeams from "../../../functions/get/getTeams";

export function validateTeam (isManager?: boolean, invites?: boolean) {
    return async function (ctx: ParameterizedContext, next: Next) {
        const ID = ctx.request.body?.ID || ctx.params?.teamID || ctx.query.ID || ctx.query.teamID;

        if (ID === undefined || isNaN(parseInt(ID)) || parseInt(ID) < 1) {
            ctx.body = {
                success: false,
                error: "Missing team ID",
            };
            return;
        }

        const teams = await getTeams(parseInt(ID), "ID", invites);

        if (teams.length !== 1) {
            ctx.body = {
                success: false,
                error: "Team not found",
            };
            return;
        }
            
        const team = teams[0];

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
        if (!isManager && team.manager.ID !== ctx.state.user.ID && !team.members.find(member => member.ID === ctx.state.user.ID)) {
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