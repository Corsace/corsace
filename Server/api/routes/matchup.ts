import Router from "@koa/router";
import { EntityManager } from "typeorm";
import { TournamentRoleType } from "../../../Interfaces/tournament";
import { Matchup } from "../../../Models/tournaments/matchup";
import { Team } from "../../../Models/tournaments/team";
import ormConfig from "../../../ormconfig";
import { isLoggedInDiscord } from "../../middleware";
import { validateTournament, hasRoles, validateStageOrRound } from "../../middleware/tournament";
import { parseDateOrTimestamp } from "../../utils/dateParse";

const matchupRouter = new Router();

interface postMatchup {
    ID: number;
    isLowerBracket?: boolean;
    date?: string;
    team1?: number;
    team2?: number;
    previousMatchups?: postMatchup[];
}

const validatePOSTMatchups = (matchups: any[]): string | true => {
    for (const matchup of matchups) {
        if (matchup.ID === undefined || isNaN(parseInt(matchup.ID)) || parseInt(matchup.ID) < 1)
            return `Invalid matchup ID provided: ${matchup.ID}`;

        if (matchup.date && (isNaN(parseDateOrTimestamp(matchup.date).getTime()) || parseDateOrTimestamp(matchup.date).getTime() < 0))
            return `Invalid matchup date provided: ${matchup.date}`;

        if (matchup.isLowerBracket !== undefined && typeof matchup.isLowerBracket !== "boolean")
            return `Invalid matchup isLowerBracket provided: ${matchup.isLowerBracket}`;

        if (matchup.team1 !== undefined && (isNaN(parseInt(matchup.team1)) || parseInt(matchup.team1) < 1))
            return `Invalid matchup team1 provided: ${matchup.team1}`;

        if (matchup.team2 !== undefined && (isNaN(parseInt(matchup.team2)) || parseInt(matchup.team2) < 1))
            return `Invalid matchup team2 provided: ${matchup.team2}`;

        if (matchup.previousMatchups) {
            if (!Array.isArray(matchup.previousMatchups) || matchup.previousMatchups.length > 3)
                return `Invalid matchup previousMatchups provided (not an array or more than 2 matchups): ${matchup.ID}`;

            if (!matchup.isLowerBracket && !matchup.previousMatchups.some(m => !m.isLowerBracket))
                return `Invalid matchup previousMatchups provided (no previous matchup is winner bracket for a winner bracket matchup): ${matchup.ID}`;

            if (matchup.previousMatchups.some(m => m.ID === matchup.ID))
                return `Invalid matchup previousMatchups provided (matchup is a previous matchup of itself): ${matchup.ID}`;

            const valid = validatePOSTMatchups(matchup.previousMatchups);
            if (valid !== true)
                return valid;
        }
    }
    return true;
};

matchupRouter.post("/create", validateTournament, validateStageOrRound, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer]), async (ctx) => {
    const matchups = ctx.request.body?.matchups;
    if (!matchups) {
        ctx.body = {
            error: "No matchups provided",
        };
        return;
    }

    const valid = validatePOSTMatchups(matchups);
    if (valid !== true) {
        ctx.body = {
            error: valid,
        };
        return;
    }

    const idToMatchup = new Map<number, Matchup>();

    const createMatchups = async (matchups: postMatchup[], transactionManager: EntityManager, parent?: Matchup): Promise<Matchup[]> => {
        const createdMatchups: Matchup[] = [];
        for (const matchup of matchups) {

            let dbMatchup = new Matchup(parent ? [parent] : undefined);
            dbMatchup.isLowerBracket = matchup.isLowerBracket || false;
            if (idToMatchup.has(matchup.ID)) {
                dbMatchup = idToMatchup.get(matchup.ID)!;
                if (dbMatchup.isLowerBracket !== matchup.isLowerBracket)
                    return Promise.reject(new Error(`Matchup ${matchup.ID} is already created with isLowerBracket ${dbMatchup.isLowerBracket}, but you provided ${matchup.isLowerBracket}`));
            }

            if (matchup.date)
                dbMatchup.date = parseDateOrTimestamp(matchup.date);
            else if (parent) // 1 hour after parent.date
                dbMatchup.date = new Date(parent.date.getTime() + 3600000);
            else // beginning of stage time
                dbMatchup.date = ctx.state.stage.timespan.start;

            if (dbMatchup.date.getTime() < ctx.state.stage.timespan.start.getTime())
                return Promise.reject(new Error(`Matchup ${matchup.ID} date is before stage start`));

            if (parent)
                dbMatchup.nextMatchups?.push(parent);

            if (ctx.state.stage)
                dbMatchup.stage = ctx.state.stage;
            else
                dbMatchup.round = ctx.state.round;

            if (matchup.team1) {
                const team1 = await transactionManager
                    .createQueryBuilder(Team, "team")
                    .where("team.ID = :teamID", { teamID: matchup.team1 })
                    .getOne();
                if (!team1)
                    return Promise.reject(new Error(`Could not find team1's ID ${matchup.team1} for matchup ${matchup.ID}`));
                dbMatchup.team1 = team1;
            }

            if (matchup.team2) {
                const team2 = await transactionManager
                    .createQueryBuilder(Team, "team")
                    .where("team.ID = :teamID", { teamID: matchup.team2 })
                    .getOne();
                if (!team2)
                    return Promise.reject(new Error(`Could not find team2's ID ${matchup.team2} for matchup ${matchup.ID}`));
                dbMatchup.team2 = team2;
            }

            await transactionManager.save(dbMatchup);
            idToMatchup.set(matchup.ID, dbMatchup);
            const previousMatchups = matchup.previousMatchups ? await createMatchups(matchup.previousMatchups, transactionManager, dbMatchup) : undefined;
            if (previousMatchups)
                dbMatchup.previousMatchups = previousMatchups;

            await transactionManager.save(dbMatchup);
            idToMatchup.set(matchup.ID, dbMatchup);
            createdMatchups.push(dbMatchup);
        }
        return createdMatchups;
    };

    try {
        await ormConfig.transaction(async transactionManager => {
            const createdMatchups = await createMatchups(matchups, transactionManager);
            ctx.body = {
                success: true,
                matchups: createdMatchups,
            };
        });
    } catch (err) {
        console.error(err);
        ctx.body = {
            success: false,
            error: err,
        };
    }
});

export default matchupRouter;