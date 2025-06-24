import { DefaultState, Next } from "koa";
import { CorsaceContext } from "../corsaceRouter";
import getTeams from "../functions/get/getTeams";
import { checkUserRoles } from "./index";

export function validateTeam (isCaptain?: boolean, invites?: boolean) {
    return async function<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next) {
        if (!ctx.state.user) {
            ctx.body = {
                success: false,
                error: "User is not logged in via osu! for the validateTeam middleware!",
            };
            return;
        }
        const user = ctx.state.user;

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

        const isCorsace = await checkUserRoles(ctx, [{ section: "corsace", role: "corsace" }]);
        if(!isCorsace) {
            if (isCaptain && team.captain.ID !== user.ID) {
                ctx.body = {
                    success: false,
                    error: "You are not the captain of this team",
                };
                return;
            } else if (!isCaptain && team.captain.ID !== user.ID && !team.members.find(member => member.ID === user.ID)) {
                ctx.body = {
                    success: false,
                    error: "You are not a member of this team",
                };
                return;
            }
        }

        ctx.state.team = team;

        await next();
    };
}
