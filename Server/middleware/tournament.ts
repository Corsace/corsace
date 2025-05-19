import { DefaultState, Next } from "koa";
import { Brackets } from "typeorm";
import { TournamentRoleType } from "../../Interfaces/tournament";
import { Stage } from "../../Models/tournaments/stage";
import { Tournament } from "../../Models/tournaments/tournament";
import { TournamentRole } from "../../Models/tournaments/tournamentRole";
import { CorsaceContext } from "../corsaceRouter";
import { getMember } from "../discord";

export async function validateTournament<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next): Promise<void> {
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

export async function validateStageOrRound<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next): Promise<void> {
    const stageID = ctx.request.body?.stageID || ctx.params?.stageID || ctx.query.stageID || ctx.request.body?.stage || ctx.params?.stage || ctx.query.stage;
    const roundID = ctx.request.body?.roundID || ctx.params?.roundID || ctx.query.roundID || ctx.request.body?.round || ctx.params?.round || ctx.query.round;

    if (roundID === undefined && (stageID === undefined || isNaN(parseInt(stageID)) || parseInt(stageID) < 1)) {
        ctx.body = {
            success: false,
            error: "Missing stage ID",
        };
        return;
    }

    if (roundID !== undefined && (isNaN(parseInt(roundID)) || parseInt(roundID) < 1)) {
        ctx.body = {
            success: false,
            error: "Invalid round ID",
        };
        return;
    }

    const stageQ = Stage
        .createQueryBuilder("stage")
        .leftJoinAndSelect("stage.rounds", "rounds")
        .leftJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("tournament.mode", "mode");
    if (ctx.state.tournament) {
        stageQ.where("tournament.ID = :tournamentID", { tournamentID: ctx.state.tournament.ID });
        if (roundID)
            stageQ
                .andWhere(new Brackets(qb => {
                    qb.where("stage.ID = :stageID", { stageID: parseInt(stageID) })
                        .orWhere("rounds.ID = :roundID", { roundID: parseInt(roundID) });
                }));
        else
            stageQ
                .andWhere("stage.ID = :stageID", { stageID: parseInt(stageID) });
    } else if (roundID)
        stageQ
            .where("rounds.ID = :roundID", { roundID: parseInt(roundID) });
    else
        stageQ.where("stage.ID = :stageID", { stageID: parseInt(stageID) });

    const stage = await stageQ.getOne();

    if (!stage) {
        ctx.body = {
            success: false,
            error: "Stage not found",
        };
        return;
    }

    if (stage.ID === parseInt(stageID))
        ctx.state.stage = stage;
    else {
        ctx.state.round = stage.rounds.find(round => round.ID === parseInt(roundID));
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
    return async<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next): Promise<void> => {
        if (!ctx.state.user?.discord?.userID) {
            ctx.body = {
                success: false,
                error: "User is not logged in via discord for the hasRoles middleware!",
            };
            return;
        }

        if (!ctx.state.tournament?.ID) {
            ctx.body = {
                success: false,
                error: "Tournament not found for the hasRoles middleware!",
            };
            return;
        }

        const member = await getMember(ctx.state.user.discord.userID, ctx.state.tournament.server);
        if (!member) {
            ctx.body = {
                success: false,
                error: "Could not obtain any discord user!",
            };
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

        ctx.body = {
            success: false,
            error: "User does not have any of the required tournament roles!",
        };
        return;
    };
}
