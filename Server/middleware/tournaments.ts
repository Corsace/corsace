import { ParameterizedContext, Next } from "koa";
import { Team } from "../../Models/tournaments/team";
import { Tournament } from "../../Models/tournaments/tournament";

async function hasNoTeams (ctx: ParameterizedContext, next: Next): Promise<void> {
    const team = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "members")
        .where("member.ID = :userID", { userID: ctx.state.user.ID })
        .orWhere("manager.ID = :userID", { userID: ctx.state.user.ID })
        .getOne();

    if (team) {
        ctx.body = { error: "User is currently in a team!" };
        return;
    }

    await next();
}

async function isManager (ctx: ParameterizedContext, next: Next): Promise<void> {
    const team = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "members")
        .where("manager.ID = :userID", { userID: ctx.state.user.ID })
        .andWhere("team.ID = :team", { team: ctx.params.team })
        .getOne();

    if (!team) {
        ctx.body = { error: "User is not the manager of the team!" };
        return;
    }

    ctx.state.team = team;
    await next();
}

async function isNotInTournament (ctx: ParameterizedContext, next: Next): Promise<void> {
    const check = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "teams")
        .leftJoinAndSelect("teams.members", "members")
        .leftJoinAndSelect("teams.manager", "manager")
        .where("members.ID = :userID", { userID: ctx.state.user.ID })
        .orWhere("manager.ID = :userID", { userID: ctx.state.user.ID })
        .andWhere("tournament.ID = :tournament", { tournament: ctx.params.tournament })
        .getOne();

    if (check) {
        ctx.body = { error: "User is currently playing in the tournament!" };
        return;
    }

    await next();
}

async function membersNotInTournament (ctx: ParameterizedContext, next: Next): Promise<void> {
    const query = Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "teams")
        .leftJoinAndSelect("teams.members", "members")
        .leftJoinAndSelect("teams.manager", "manager")
        .where("members.ID = :userID", { userID: ctx.state.user.ID })
        .orWhere("manager.ID = :userID", { userID: ctx.state.user.ID });
    
    for (const member of ctx.state.team.members) {
        query.orWhere("members.ID = :userID", { userID: member.ID })
        query.orWhere("manager.ID = :userID", { userID: member.ID });
    }

    const check = await query
        .andWhere("tournament.ID = :tournament", { tournament: ctx.params.tournament })
        .getOne();

    if (check) {
        ctx.body = { error: "User is currently playing in the tournament!" };
        return;
    }

    await next();
}

export { hasNoTeams, isManager, isNotInTournament, membersNotInTournament };