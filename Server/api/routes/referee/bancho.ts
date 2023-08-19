import Axios from "axios";
import Router from "@koa/router";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { isLoggedInDiscord } from "../../../middleware";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { TournamentRoleType, unallowedToPlay } from "../../../../Interfaces/tournament";
import { discordClient } from "../../../discord";
import { hasRoles, validateTournament } from "../../../middleware/tournament";

const refereeBanchoRouter = new Router();

refereeBanchoRouter.post("/:tournamentID/:matchupID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    if (!ctx.request.body.endpoint) {
        ctx.body = {
            success: false,
            error: "Missing endpoint",
        };
        return;
    }

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("matchup.first", "first")
        .leftJoinAndSelect("matchup.winner", "winner")
        .leftJoinAndSelect("matchup.referee", "referee")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .innerJoinAndSelect("tournament.organizer", "organizer")
        .where("matchup.id = :matchupID", { matchupID: ctx.params.matchupID })
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    if (matchup.referee?.ID !== ctx.state.user.id && matchup.stage!.tournament.organizer.ID !== ctx.state.user.id) {
        // If not organizer check if they are referee
        const roles = await TournamentRole
            .createQueryBuilder("role")
            .innerJoin("role.tournament", "tournament")
            .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
            .getMany();

        // For organizers to see all matchups
        let bypass = false;
        if (roles.length > 0) {
            try {
                const privilegedRoles = roles.filter(r => unallowedToPlay.some(u => u === r.roleType));
                const tournamentServer = await discordClient.guilds.fetch(ctx.state.tournament.server);
                const discordMember = await tournamentServer.members.fetch(ctx.state.user.discord.userID);
                bypass = privilegedRoles.some(r => discordMember.roles.cache.has(r.roleID));
            } catch (e) {
                bypass = false;
            }
        }

        if (!bypass) {
            ctx.body = {
                success: false,
                error: "You are not the referee of this matchup",
            };
            return;
        }
    }

    try {
        const { data } = await Axios.post(`${matchup.baseURL ?? config.banchoBot.publicUrl}/api/bancho/referee/${matchup.ID}/${ctx.request.body.endpoint}`, {
            ...ctx.request.body,
            endpoint: undefined,
        }, {
            auth: config.interOpAuth,
        });

        ctx.body = data;

    } catch (e) {
        if (Axios.isAxiosError(e)) {
            ctx.body = {
                success: false,
                error: e.response,
            };
        } else if (e instanceof Error) {
            ctx.body = {
                success: false,
                error: e.message,
            };
        } else {
            ctx.body = {
                success: false,
                error: `Unknown error: ${e}`,
            };
        }
    }
});

export default refereeBanchoRouter;