import Router from "@koa/router";
import { validateTeam } from "./middleware";
import { isLoggedInDiscord } from "../../../middleware";
import { Team } from "../../../../Models/tournaments/team";
import { User } from "../../../../Models/user";
import { inviteAcceptChecks, invitePlayer } from "../../../functions/tournaments/teams/inviteFunctions";
import getTeamInvites from "../../../functions/get/getTeamInvites";
import { BaseTeam, TeamUser } from "../../../../Interfaces/team";
import { TeamInvite } from "../../../../Models/tournaments/teamInvite";

type idType = "osu" | "discord" | "corsace";

function isIdType (value: any): value is idType {
    return value === "osu" || value === "discord" || value === "corsace";
}

const inviteRouter = new Router();

inviteRouter.get("/user", isLoggedInDiscord, async (ctx) => {
    const user: User = ctx.state.user;

    const invites = await getTeamInvites(user.ID, "userID");

    ctx.body = invites.map<BaseTeam>(i => {
        return {
            ID: i.team.ID,
            name: i.team.name,
        };
    });
});

inviteRouter.get("/:teamID", isLoggedInDiscord, validateTeam(false), async (ctx) => {
    const team: Team = ctx.state.team;

    const invites = await getTeamInvites(team.ID, "teamID");

    ctx.body = invites.map<TeamUser>(i => {
        return {
            ID: i.user.ID,
            username: i.user.osu.username,
            osuID: i.user.osu.userID,
        };
    });
});

inviteRouter.post("/:teamID", isLoggedInDiscord, validateTeam(true, true), async (ctx) => {
    const team: Team = ctx.state.team;

    const userID = ctx.request.body?.userID;
    const idType = ctx.request.body?.idType;
    if (!userID) {
        ctx.body = { error: "Missing user ID" };
        return;
    }
    if (!idType) {
        ctx.body = { error: "Missing ID type" };
        return;
    }
    if (!isIdType(idType)) {
        ctx.body = { error: "Invalid ID type. Must be one of: osu, discord, corsace" };
        return;
    }

    let user: User | null = null;
    if (idType === "osu")
        user = await User.findOne({ where: { osu: { userID } } });
    else if (idType === "discord")
        user = await User.findOne({ where: { discord: { userID } } });
    else if (idType === "corsace")
        user = await User.findOne({ where: { ID: userID } });

    if (!user) {
        ctx.body = { error: "User not found" };
        return;
    }

    try {
        const invite = await invitePlayer(team, user);
        if (typeof invite === "string") {
            ctx.body = { error: invite };
            return;
        }

        await invite.save();

        ctx.body = { success: "User invited", invite };
    } catch (e) {
        ctx.body = { error: `Error inviting user. Contact VINXIS.\n${e}` };
        return;
    }
});

inviteRouter.post("/:teamID/accept", isLoggedInDiscord, async (ctx) => {
    const user: User = ctx.state.user;
    let invite: TeamInvite;
    try {
        const invites = await getTeamInvites(ctx.params.teamID, "teamID", user.ID, "userID", true, true, true);
        if (invites.length === 0) {
            ctx.body = { error: "No invite found from this team to you" };
            return;
        }
        if (invites.length > 1) {
            ctx.body = { error: "Multiple invites found from this team to you. Contact VINXIS" };
            return;
        }

        invite = invites[0];
    } catch (e) {
        ctx.body = { error: `Error getting invites. Contact VINXIS.\n${e}` };
        return;
    }
    
    try {
        const check = await inviteAcceptChecks(invite);
        if (check !== true) {
            ctx.body = { error: check };
            return;
        }
    } catch (e) {
        ctx.body = { error: `Error checking invite. Contact VINXIS.\n${e}` };
        return;
    }

    const team = invite.team;
    team.members.push(user);
    await team.calculateStats();
    await team.save();

    await invite.remove();

    ctx.body = { success: "Invite accepted", team };
});

inviteRouter.post("/:teamID/decline", isLoggedInDiscord, async (ctx) => {
    const user: User = ctx.state.user;
    let invite: TeamInvite;
    try {
        const invites = await getTeamInvites(ctx.params.teamID, "teamID", user.ID, "userID", true, true, true);
        if (invites.length === 0) {
            ctx.body = { error: "No invite found from this team to you" };
            return;
        }
        if (invites.length > 1) {
            ctx.body = { error: "Multiple invites found from this team to you. Contact VINXIS" };
            return;
        }

        invite = invites[0];
    } catch (e) {
        ctx.body = { error: `Error getting invites. Contact VINXIS.\n${e}` };
        return;
    }

    await invite.remove();

    ctx.body = { success: "Invite declined" };
});

inviteRouter.post("/:teamID/cancel/:userID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    const userID = ctx.params.userID;
    if (!userID) {
        ctx.body = { error: "Missing user ID" };
        return;
    }

    let invite: TeamInvite;
    try {
        const invites = await getTeamInvites(team.ID, "teamID", userID, "userID", true, true, true);
        if (invites.length === 0) {
            ctx.body = { error: "No invite found from this team to you" };
            return;
        }
        if (invites.length > 1) {
            ctx.body = { error: "Multiple invites found from this team to you. Contact VINXIS" };
            return;
        }

        invite = invites[0];
    } catch (e) {
        ctx.body = { error: `Error getting invites. Contact VINXIS.\n${e}` };
        return;
    }

    await invite.remove();

    ctx.body = { success: "Invite removed" };
});

export default inviteRouter;