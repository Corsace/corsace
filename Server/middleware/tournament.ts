import { Next, ParameterizedContext } from "koa";
import { Brackets } from "typeorm";
import { TournamentRoleType } from "../../Interfaces/tournament";
import { Stage } from "../../Models/tournaments/stage";
import { Tournament } from "../../Models/tournaments/tournament";
import { TournamentRole } from "../../Models/tournaments/tournamentRole";
import { getMember } from "../discord";

export async function validateTournament (ctx: ParameterizedContext, next: Next): Promise<void> {
    const ID = ctx.request.body?.tournamentID || ctx.params?.tournamentID || ctx.query.tournamentID || ctx.request.body?.tournament || ctx.params?.tournament || ctx.query.tournament;

    if (ID === undefined || isNaN(parseInt(ID)) || parseInt(ID) < 1) {
        ctx.body = {
            success: false,
            error: "Missing tournament ID",
        };
        return;
    }

    const tournament = await Tournament.findOne({
        where: {
            ID: parseInt(ID),
        },
    });

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }

    ctx.state.tournament = tournament;

    await next();

}

export async function validateStageOrRound (ctx: ParameterizedContext, next: Next): Promise<void> {
    const ID = ctx.request.body?.stageID || ctx.params?.stageID || ctx.query.stageID || ctx.request.body?.roundID || ctx.params?.roundID || ctx.query.roundID || ctx.request.body?.stage || ctx.params?.stage || ctx.query.stage || ctx.request.body?.round || ctx.params?.round || ctx.query.round;
    
    if (ID === undefined || isNaN(parseInt(ID)) || parseInt(ID) < 1) {
        ctx.body = {
            success: false,
            error: "Missing stage or round ID",
        };
        return;
    }

    const stage = await Stage
        .createQueryBuilder("stage")
        .leftJoinAndSelect("stage.rounds", "rounds")
        .leftJoinAndSelect("stage.tournament", "tournament")
        .where("tournament.ID = :tournamentID", { tournamentID: ctx.state.tournament.ID })
        .andWhere(new Brackets(qb => {
            qb.where("stage.ID = :stageID", { stageID: parseInt(ID) })
                .orWhere("rounds.ID = :roundID", { roundID: parseInt(ID) });
        }))
        .getOne();


    if (!stage) {
        ctx.body = {
            success: false,
            error: "Stage not found",
        };
        return;
    }
    
    if (stage.ID === parseInt(ID))
        ctx.state.stage = stage;
    else {
        ctx.state.round = stage.rounds.find(round => round.ID === parseInt(ID));
        if (!ctx.state.round) {
            ctx.body = {
                success: false,
                error: "Round not found",
            };
            return;
        }
        ctx.state.stage = stage;
    }

    await next();
}

export function hasRoles (roles: TournamentRoleType[]) {
    return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
        const member = await getMember(ctx.state.user.discord.userID);
        if (!member) {
            ctx.body = { error: "Could not obtain any discord user!" };
            return;
        }

        const tournamentRoles = await TournamentRole
            .createQueryBuilder("tournamentRole")
            .innerJoin("tournamentRole.tournament", "tournament")
            .where("tournament.ID = :tournamentID", { tournamentID: ctx.state.tournament.ID })
            .getMany();

        const filterRoles = tournamentRoles.filter(role => roles.some(r => role.roleType === r));
        
        if (member.roles.cache.some(role => filterRoles.some(r => r.roleID === role.id))) {
            await next();
            return;
        }
        
        ctx.body = { error: "User does not have any of the required tournament roles!" };
        return;
    };
}