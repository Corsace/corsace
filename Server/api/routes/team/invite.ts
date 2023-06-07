import Router from "@koa/router";
import { validateTeam } from "./middleware";
import { isLoggedInDiscord } from "../../../middleware";
import { Team } from "../../../../Models/tournaments/team";
import { User } from "../../../../Models/user";
import { TeamInvite } from "../../../../Models/tournaments/teamInvite";
import { TournamentStatus } from "../../../../Models/tournaments/tournament";

const inviteRouter = new Router();

inviteRouter.get("/:teamID", isLoggedInDiscord, validateTeam(false), async (ctx) => {
    const team: Team = ctx.state.team;

    const invites = await TeamInvite
        .createQueryBuilder("invite")
        .leftJoin("invite.team", "team")
        .leftJoinAndSelect("invite.user", "user")
        .where("team.ID = :ID", { ID: team.ID })
        .getMany();

    ctx.body = { invites };
});

inviteRouter.post("/:teamID/invite", isLoggedInDiscord, validateTeam(true, true), async (ctx) => {
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

    let user: User | null = null;
    if (idType === "osu")
        user = await User.findOne({ where: { osu: { userID } } });
    else if (idType === "discord")
        user = await User.findOne({ where: { discord: { userID } } });
    else if (idType === "corsace")
        user = await User.findOne({ where: { ID: userID } });
    else {
        ctx.body = { error: "Invalid ID type" };
        return;
    }

    if (!user) {
        ctx.body = { error: "User not found" };
        return;
    }

    if (team.members.some(m => m.ID === user?.ID) || team.manager.ID === user?.ID) {
        ctx.body = { error: "User is already in the team" };
        return;
    }

    if (team.invites?.some(i => i.ID === user?.ID)) {
        ctx.body = { error: "User is already invited" };
        return;
    }

    const invite = new TeamInvite;
    invite.team = team;
    invite.user = user;
    await invite.save();

    ctx.body = { success: "User invited", invite };
});

inviteRouter.post("/:teamID/accept", isLoggedInDiscord, async (ctx) => {
    const user: User = ctx.state.user;
    const invite = await TeamInvite
        .createQueryBuilder("invite")
        .leftJoinAndSelect("invite.team", "team")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("team.tournaments", "tournament")
        .leftJoinAndSelect("tournament.roles", "role")
        .leftJoin("invite.user", "user")
        .where("team.ID = :ID", { ID: ctx.params.teamID })
        .andWhere("user.discordUserid = :discordUserID", { discordUserID: user.discord.userID })
        .getOne();

    if (!invite) {
        ctx.body = { error: "Invite not found" };
        return;
    }

    // Check if user is staff in any tournament the team is in, and if the team is in any tournament past the registration phase
    const teamTournaments = invite.team.tournaments;
    if (teamTournaments.some(t => t.status === TournamentStatus.Ongoing)) {
        ctx.body = { error: "Team is already in an ongoing tournament" };
        return;
    }

    const team = invite.team;
    if (team.members.length === 16) {
        ctx.body = { error: "Team is full" };
        return;
    }

    team.members.push(user);
    await team.save();

    await invite.remove();

    ctx.body = { success: "Invite accepted", team };
});

inviteRouter.post("/:teamID/decline", isLoggedInDiscord, async (ctx) => {
    const user: User = ctx.state.user;
    const invite = await TeamInvite
        .createQueryBuilder("invite")
        .leftJoinAndSelect("invite.team", "team")
        .leftJoinAndSelect("team.members", "member")
        .leftJoin("invite.user", "user")
        .where("team.ID = :ID", { ID: ctx.params.teamID })
        .andWhere("user.discordUserid = :discordUserID", { discordUserID: user.discord.userID })
        .getOne();

    if (!invite) {
        ctx.body = { error: "Invite not found" };
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

    const invite = await TeamInvite
        .createQueryBuilder("invite")
        .leftJoin("invite.team", "team")
        .leftJoin("invite.user", "user")
        .where("team.ID = :ID", { ID: team.ID })
        .andWhere("user.ID = :userID", { userID })
        .getOne();

    if (!invite) {
        ctx.body = { error: "Invite not found" };
        return;
    }

    await invite.remove();

    ctx.body = { success: "Invite removed" };
});

export default inviteRouter;