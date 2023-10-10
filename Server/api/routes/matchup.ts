import axios from "axios";
import { CorsaceRouter } from "../../corsaceRouter";
import { Multi } from "nodesu";
import { Brackets, EntityManager } from "typeorm";
import { StageType } from "../../../Interfaces/stage";
import { TournamentRoleType } from "../../../Interfaces/tournament";
import { MapStatus, Matchup as MatchupInterface } from "../../../Interfaces/matchup";
import { Matchup } from "../../../Models/tournaments/matchup";
import { MatchupMap } from "../../../Models/tournaments/matchupMap";
import { MatchupScore } from "../../../Models/tournaments/matchupScore";
import { Team } from "../../../Models/tournaments/team";
import { User } from "../../../Models/user";
import ormConfig from "../../../ormconfig";
import { isCorsace, isLoggedInDiscord } from "../../middleware";
import { validateTournament, hasRoles, validateStageOrRound } from "../../middleware/tournament";
import { osuClient } from "../../osu";
import { parseDateOrTimestamp } from "../../utils/dateParse";
import assignTeamsToNextMatchup from "../../functions/tournaments/matchups/assignTeamsToNextMatchup";
import { Round } from "../../../Models/tournaments/round";
import { Stage } from "../../../Models/tournaments/stage";
import { config } from "node-config-ts";
import { MatchupSet } from "../../../Models/tournaments/matchupSet";
import dbMatchupToInterface from "../../functions/tournaments/matchups/dbMatchupToInterface";
import { ResponseBody, TournamentStageState, TournamentState } from "koa";

const matchupRouter  = new CorsaceRouter();

interface postMatchup {
    ID: number;
    isLowerBracket?: boolean;
    potentials?: boolean;
    date?: string;
    team1?: number;
    team2?: number;
    previousMatchups?: postMatchup[];
}

function sanitizeMatchupResponse (matchup: Matchup) {
    return {
        ID: matchup.ID,
        stage: matchup.stage,
        teams: matchup.teams,
        team1: matchup.team1,
        team2: matchup.team2,
        team1Score: matchup.team1Score,
        team2Score: matchup.team2Score,
        winner: matchup.winner,
        sets: matchup.sets?.map(set => ({
            ID: set.ID,
            order: set.order, 
            maps: set.maps?.map(map => ({
                ID: map.ID,
                map: map.map,
                order: map.order,
                team1Score: map.team1Score,
                team2Score: map.team2Score,
                winner: map.winner,
                scores: map.scores.map(score => ({
                    ID: score.ID,
                    user: score.user,
                    score: score.score,
                    mods: score.mods,
                    misses: score.misses,
                    combo: score.combo,
                    fail: score.fail,
                    accuracy: score.accuracy,
                    fullCombo: score.fullCombo,
                })),
            })),
        })),
    };
}

function requiredNumberFields<T extends Record<string, any>> (obj: Partial<T>, fields: (keyof T)[]): string | Record<keyof T, number> {
    const result: Record<string, number> = {};

    for (const field of fields) {
        if (!obj[field] && obj[field] !== 0) 
            return `Field ${String(field)} is missing`;

        const value = typeof obj[field] === "string" ? parseInt(obj[field]!) : obj[field];
        if (typeof value !== "number" || isNaN(value)) 
            return `Field ${String(field)} is invalid`;

        result[field as string] = value;
    }

    return result as Record<keyof T, number>;
}

async function updateMatchup (matchupID: number) {
    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.stage", "stage")
        .leftJoinAndSelect("matchup.sets", "set")
        .leftJoinAndSelect("set.maps", "map")
        .leftJoinAndSelect("map.scores", "score")
        .leftJoinAndSelect("score.user", "user")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("team1.members", "team1member")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team2.members", "team2member")
        .where("matchup.ID = :matchupID", { matchupID })
        .andWhere("stage.stageType != '0'")
        .getOne();

    if (matchup) {
        matchup.sets!.forEach(async set => {
            set.maps!.forEach(async map => {
                map.team1Score = map.scores
                    .filter(score => matchup.team1!.members.some(member => member.ID === score.user.ID))
                    .reduce((acc, score) => acc + score.score, 0);
                map.team2Score = map.scores
                    .filter(score => matchup.team2!.members.some(member => member.ID === score.user.ID))
                    .reduce((acc, score) => acc + score.score, 0);

                if (map.team1Score > map.team2Score)
                    map.winner = matchup.team1;
                else if (map.team2Score > map.team1Score)
                    map.winner = matchup.team2;

                await map.save();
            });

            set.team1Score = set.maps!.filter(map => map.team1Score && map.team2Score ? map.team1Score > map.team2Score : false).length;
            set.team2Score = set.maps!.filter(map => map.team1Score && map.team2Score ? map.team2Score > map.team1Score : false).length;

            if (set.team1Score > set.team2Score)
                set.winner = matchup.team1;
            else if (set.team2Score > set.team1Score)
                set.winner = matchup.team2;

            await set.save();
        });
        matchup.team1Score = matchup.sets!.filter(map => map.team1Score && map.team2Score ? map.team1Score > map.team2Score : false).length;
        matchup.team2Score = matchup.sets!.filter(map => map.team1Score && map.team2Score ? map.team2Score > map.team1Score : false).length;
        if (matchup.team1Score > matchup.team2Score)
            matchup.winner = matchup.team1;
        else if (matchup.team2Score > matchup.team1Score)
            matchup.winner = matchup.team2;
        await matchup.save();
    }
}

function validatePOSTMatchups (matchups: Partial<postMatchup>[]): asserts matchups is postMatchup[] {
    for (const matchup of matchups) {
        if (typeof matchup.ID !== "number" || isNaN(matchup.ID) || matchup.ID < 1)
            throw new Error(`Invalid matchup ID provided: ${matchup.ID}`);

        if (matchup.date && (isNaN(parseDateOrTimestamp(matchup.date).getTime()) || parseDateOrTimestamp(matchup.date).getTime() < 0))
            throw new Error(`Invalid matchup date provided: ${matchup.date}`);

        if (matchup.isLowerBracket !== undefined && typeof matchup.isLowerBracket !== "boolean")
            throw new Error(`Invalid matchup isLowerBracket provided: ${matchup.isLowerBracket}`);

        if (matchup.potentials !== undefined && typeof matchup.potentials !== "boolean")
            throw new Error(`Invalid matchup potentials provided: ${matchup.potentials}`);

        if (typeof matchup.team1 !== "number" || isNaN(matchup.team1) || matchup.team1 < 1)
            throw new Error(`Invalid matchup team1 provided: ${matchup.team1}`);

        if (typeof matchup.team2 !== "number" || isNaN(matchup.team2) || matchup.team2 < 1)
            throw new Error(`Invalid matchup team2 provided: ${matchup.team2}`);

        if (matchup.previousMatchups) {
            if (!Array.isArray(matchup.previousMatchups) || matchup.previousMatchups.length > 3)
                throw new Error(`Invalid matchup previousMatchups provided (not an array or more than 2 matchups): ${matchup.ID}`);

            if (!matchup.isLowerBracket && !matchup.previousMatchups.some(m => !m.isLowerBracket))
                throw new Error(`Invalid matchup previousMatchups provided (no previous matchup is winner bracket for a winner bracket matchup): ${matchup.ID}`);

            if (matchup.previousMatchups.some(m => m.ID === matchup.ID))
                throw new Error(`Invalid matchup previousMatchups provided (matchup is a previous matchup of itself): ${matchup.ID}`);

            validatePOSTMatchups(matchup.previousMatchups);
        }
    }
}

matchupRouter.$get("/:matchupID", async (ctx) => {
    const dbMatchup = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.round", "round")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team1.manager", "manager1")
        .leftJoinAndSelect("team2.manager", "manager2")
        .leftJoinAndSelect("team1.members", "members1")
        .leftJoinAndSelect("team2.members", "members2")
        .leftJoinAndSelect("matchup.winner", "winner")
        .leftJoinAndSelect("matchup.sets", "set")
        .leftJoinAndSelect("set.first", "first")
        .leftJoinAndSelect("set.maps", "maps")
        .leftJoinAndSelect("maps.map", "map")
        .leftJoinAndSelect("map.beatmap", "beatmap")
        .leftJoinAndSelect("beatmap.beatmapset", "beatmapset")
        .leftJoinAndSelect("beatmapset.creator", "creator")
        .leftJoinAndSelect("map.customBeatmap", "customBeatmap")
        .leftJoinAndSelect("map.customMappers", "customMappers")
        .leftJoinAndSelect("map.slot", "slot")
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID })
        .getOne();

    if (!dbMatchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found.",
        };
        return;
    }

    const roundOrStage: Round | Stage | null = 
        dbMatchup.round ? 
            await Round
                .createQueryBuilder("round")
                .innerJoin("round.matchups", "matchup")
                .leftJoinAndSelect("round.mappool", "mappool")
                .leftJoinAndSelect("mappool.slots", "slots")
                .leftJoinAndSelect("slots.maps", "maps")
                .leftJoinAndSelect("maps.beatmap", "map")
                .leftJoinAndSelect("map.beatmapset", "beatmapset")
                .leftJoinAndSelect("beatmapset.creator", "creator")
                .leftJoinAndSelect("maps.customBeatmap", "customBeatmap")
                .leftJoinAndSelect("maps.customMappers", "customMappers")
                .leftJoinAndSelect("round.mapOrder", "mapOrder")
                .where("matchup.ID = :ID", { ID: dbMatchup.ID })
                .getOne() :
            dbMatchup.stage ?
                await Stage
                    .createQueryBuilder("stage")
                    .innerJoin("stage.matchups", "matchup")
                    .leftJoinAndSelect("stage.mappool", "mappool")
                    .leftJoinAndSelect("mappool.slots", "slots")
                    .leftJoinAndSelect("slots.maps", "maps")
                    .leftJoinAndSelect("maps.beatmap", "map")
                    .leftJoinAndSelect("map.beatmapset", "beatmapset")
                    .leftJoinAndSelect("beatmapset.creator", "creator")
                    .leftJoinAndSelect("maps.customBeatmap", "customBeatmap")
                    .leftJoinAndSelect("maps.customMappers", "customMappers")
                    .leftJoinAndSelect("stage.mapOrder", "mapOrder")
                    .where("matchup.ID = :ID", { ID: dbMatchup.ID })
                    .getOne() : 
                null;

    const body: {
        success: true;
        matchup: MatchupInterface;
    } = {
        success: true,
        matchup: await dbMatchupToInterface(dbMatchup, roundOrStage),
    };
    
    ctx.body = body;
});

matchupRouter.$get("/:matchupID/bancho/:endpoint", async (ctx) => {
    const endpoint = ctx.params.endpoint;

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .where("matchup.id = :matchupID", { matchupID: ctx.params.matchupID })
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    try {
        const { data } = await axios.get<ResponseBody<unknown>>(`${matchup.baseURL ?? config.banchoBot.publicUrl}/api/bancho/stream/${matchup.ID}/${endpoint}`, {
            auth: config.interOpAuth,
        });

        ctx.body = data;
    } catch (e) {
        if (axios.isAxiosError(e)) {
            ctx.body = e.response?.data ?? {
                success: false,
                error: e.message,
            };
            ctx.status = e.response?.status ?? 500;
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

matchupRouter.$get<{ matchup: Matchup }>("/:matchupID/teams", async (ctx) => {
    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team1.manager", "manager1")
        .leftJoinAndSelect("team2.manager", "manager2")
        .leftJoinAndSelect("team1.members", "members1")
        .leftJoinAndSelect("team2.members", "members2")
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID })
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found.",
        };
        return;
    }

    ctx.body = {
        success: true,
        matchup,
    };
});

matchupRouter.$post<{ matchups: Matchup[] }, TournamentStageState>("/create", validateTournament, validateStageOrRound, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer]), async (ctx) => {
    const matchups: Partial<postMatchup>[] | postMatchup[] = ctx.request.body?.matchups;
    if (!matchups) {
        ctx.body = {
            success: false,
            error: "No matchups provided",
        };
        return;
    }

    validatePOSTMatchups(matchups);

    const idToMatchup = new Map<number, Matchup>();

    const createMatchups = async (matchups: postMatchup[], transactionManager: EntityManager): Promise<Matchup[]> => {
        const createdMatchups: Matchup[] = [];
        for (const matchup of matchups) {

            let dbMatchup = new Matchup();
            dbMatchup.isLowerBracket = matchup.isLowerBracket ?? false;
            if (idToMatchup.has(matchup.ID)) {
                dbMatchup = idToMatchup.get(matchup.ID)!;
                if (dbMatchup.isLowerBracket !== matchup.isLowerBracket)
                    return Promise.reject(new Error(`Matchup ${matchup.ID} is already created with isLowerBracket ${dbMatchup.isLowerBracket}, but you provided ${matchup.isLowerBracket}`));
            }

            if (matchup.date)
                dbMatchup.date = parseDateOrTimestamp(matchup.date);
            else // beginning of stage time
                dbMatchup.date = ctx.state.stage.timespan.start;

            if (dbMatchup.date.getTime() < ctx.state.stage.timespan.start.getTime())
                return Promise.reject(new Error(`Matchup ${matchup.ID} date ${dbMatchup.date} is before stage start ${ctx.state.stage.timespan.start}`));

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

            idToMatchup.set(matchup.ID, dbMatchup);
            const previousMatchups = matchup.previousMatchups ? await createMatchups(matchup.previousMatchups, transactionManager) : undefined;
            if (previousMatchups)
                dbMatchup.previousMatchups = previousMatchups;

            if (matchup.potentials) {
                dbMatchup.potentials = [];
                const teams = previousMatchups?.map(m => {
                    if (m.winner)
                        return [ m.winner ];

                    const teamArray: Team[] = [];
                    if (m.team1)
                        teamArray.push(m.team1);
                    if (m.team2)
                        teamArray.push(m.team2);

                    return teamArray;
                }) ?? [];
                if (teams.flat().length < 2)
                    for (let i = 0; i < 4; i++) {
                        const potential = new Matchup();
                        potential.date = dbMatchup.date;
                        if (ctx.state.stage)
                            potential.stage = ctx.state.stage;
                        else
                            potential.round = ctx.state.round;
                        dbMatchup.potentials.push(potential);
                    }
                else
                    for (let i = 0; i < teams.length; i++) {
                        for (let j = i + 1; j < teams.length; j++) {
                            for (const team of teams[i]) {
                                for (const team2 of teams[j]) {
                                    const potential = new Matchup();
                                    potential.date = dbMatchup.date;
                                    potential.team1 = team;
                                    potential.team2 = team2;
                                    potential.isLowerBracket = dbMatchup.isLowerBracket;
                                    if (ctx.state.stage)
                                        potential.stage = ctx.state.stage;
                                    else
                                        potential.round = ctx.state.round;
                                    dbMatchup.potentials.push(potential);
                                }
                            }
                        }
                    }
            }
            idToMatchup.set(matchup.ID, dbMatchup);
            createdMatchups.push(dbMatchup);
        }
        return createdMatchups;
    };

    try {
        await ormConfig.transaction(async transactionManager => {
            const createdMatchups = await createMatchups(matchups, transactionManager);
            // Reverse Level Order Traversal to save the initial matchups (and their potentials) first at each level, before saving levels closer to the root
            const stack: Matchup[] = [];
            const queue: Matchup[] = [];
            queue.push(...createdMatchups.reverse());

            while (queue.length > 0) {
                const node = queue.shift()!;
                stack.push(node);
                stack.push(...node.potentials ?? []);

                if (node.previousMatchups)
                    queue.push(...node.previousMatchups);
            }

            while (stack.length > 0) {
                const node = stack.pop()!;
                await transactionManager.save(node);
            }

            ctx.body = {
                success: true,
                matchups: createdMatchups,
            };
        });
    } catch (err) {
        console.error(err);
        ctx.body = {
            success: false,
            error: err instanceof Error ? err.message : typeof err === "string" ? err : "Internal server error",
        };
    }
});

matchupRouter.$post<{ matchup: Matchup }, TournamentState>("/assignTeam", validateTournament, validateStageOrRound, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer]), async (ctx) => {
    const tournament = ctx.state.tournament;
    const stageOrRound = ctx.state.stage ?? ctx.state.round ?? null;
    if (!stageOrRound) {
        ctx.body = {
            success: false,
            error: "No stage or round provided",
        };
        return;
    }


    const matchupID = ctx.request.body?.matchupID;
    if (!matchupID || isNaN(parseInt(matchupID))) {
        ctx.body = {
            success: false,
            error: "No matchup ID provided",
        };
        return;
    }

    const teamID = ctx.request.body?.teamID;
    if (!teamID || isNaN(parseInt(teamID))) {
        ctx.body = {
            success: false,
            error: "No team ID provided",
        };
        return;
    }
    const team = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .where("team.ID = :teamID", { teamID })
        .getOne();
    if (!team) {
        ctx.body = {
            success: false,
            error: "Team not found",
        };
        return;
    }

    const team1Or2 = ctx.request.body?.team1Or2;
    if (team1Or2 !== 1 && team1Or2 !== 2) {
        ctx.body = {
            success: false,
            error: "No team1 or team2 provided",
        };
        return;
    }

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .leftJoin("matchup.round", "round")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("matchup.potentials", "potential")
        .leftJoinAndSelect("potential.team1", "potentialTeam1")
        .leftJoinAndSelect("potential.team2", "potentialTeam2")
        .where("matchup.ID = :matchupID", { matchupID })
        .andWhere("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .andWhere(new Brackets(qb => {
            qb.where("stage.ID = :stageID", { stageID: stageOrRound.ID });
            qb.orWhere("round.ID = :roundID", { roundID: stageOrRound.ID });
        }))
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    if (matchup.team1?.ID === parseInt(teamID) || matchup.team2?.ID === parseInt(teamID)) {
        ctx.body = {
            success: false,
            error: "Team is already assigned to matchup",
        };
        return;
    }
    
    if (team1Or2 === 1) {
        if (matchup.team1) {
            ctx.body = {
                success: false,
                error: "Team1 is already assigned to matchup",
            };
            return;
        }
        matchup.team1 = team;
    } else {
        if (matchup.team2) {
            ctx.body = {
                success: false,
                error: "Team2 is already assigned to matchup",
            };
            return;
        }
        matchup.team2 = team;
    }

    if (matchup.potentials) {
        const potentialsWithoutTeam = matchup.potentials.filter(potential => potential.team1?.ID !== parseInt(teamID) && potential.team2?.ID !== parseInt(teamID));
        await Promise.all(potentialsWithoutTeam.map(potential => {
            potential.invalid = true;
            return potential.save();
        }));
    }
    if (matchup.potentials && matchup.potentials.filter(potential => !potential.invalid).length === 1)
        matchup.date = matchup.potentials.find(potential => !potential.invalid)!.date;

    await matchup.save();

    ctx.body = {
        success: true,
        matchup,
    };
});

matchupRouter.$post<{ matchup: Matchup }, TournamentState>("/date", validateTournament, validateStageOrRound, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer]), async (ctx) => {
    const tournament = ctx.state.tournament;
    const stageOrRound = ctx.state.stage ?? ctx.state.round ?? null;
    if (!stageOrRound) {
        ctx.body = {
            success: false,
            error: "No stage or round provided",
        };
        return;
    }

    const matchupID = ctx.request.body?.matchupID;
    if (!matchupID || isNaN(parseInt(matchupID))) {
        ctx.body = {
            success: false,
            error: "No matchup ID provided",
        };
        return;
    }

    const date = ctx.request.body?.date;
    if (!date || (isNaN(parseDateOrTimestamp(date).getTime()) || parseDateOrTimestamp(date).getTime() < 0)) {
        ctx.body = {
            success: false,
            error: "No date provided",
        };
        return;
    }

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .leftJoin("matchup.round", "round")
        .where("matchup.ID = :matchupID", { matchupID })
        .andWhere("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .andWhere(new Brackets(qb => {
            qb.where("stage.ID = :stageID", { stageID: stageOrRound.ID });
            qb.orWhere("round.ID = :roundID", { roundID: stageOrRound.ID });
        }))
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    matchup.date = parseDateOrTimestamp(date);
    await matchup.save();

    ctx.body = {
        success: true,
        matchup,
    };
});

matchupRouter.$post<{ matchup: object }>("/mp", isLoggedInDiscord, isCorsace, async (ctx) => {
    if (!ctx.request.body) {
        ctx.body = {
            success: false,
            error: "No request body",
        };
        return;
    }

    const obj = requiredNumberFields(ctx.request.body, ["mpID", "matchID"]);
    if (typeof obj === "string") {
        ctx.body = {
            success: false,
            error: obj,
        };
        return;
    }

    const { mpID, matchID } = obj;

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.round", "round")
        .leftJoinAndSelect("round.mappool", "roundMappool")
        .leftJoinAndSelect("roundMappool.slots", "roundSlot")
        .leftJoinAndSelect("roundSlot.maps", "roundMap")
        .leftJoinAndSelect("roundMap.beatmap", "roundBeatmap")
        .leftJoinAndSelect("round.mapOrder", "roundMapOrder")
        .innerJoinAndSelect("matchup.stage", "stage")
        .leftJoinAndSelect("stage.mappool", "stageMappool")
        .leftJoinAndSelect("stageMappool.slots", "stageSlot")
        .leftJoinAndSelect("stageSlot.maps", "stageMap")
        .leftJoinAndSelect("stageMap.beatmap", "stageBeatmap")
        .leftJoinAndSelect("stage.mapOrder", "stageMapOrder")
        .leftJoinAndSelect("matchup.teams", "team")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("team1.manager", "team1manager")
        .leftJoinAndSelect("team1.members", "team1member")
        .leftJoinAndSelect("team2.manager", "team2manager")
        .leftJoinAndSelect("team2.members", "team2member")
        .leftJoinAndSelect("matchup.sets", "set")
        .leftJoinAndSelect("set.maps", "matchupMap")
        .leftJoinAndSelect("matchupMap.scores", "score")
        .where("matchup.ID = :matchID", { matchID })
        .getOne();
    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpData = await osuClient.multi.getMatch(mpID) as Multi;
    const set = new MatchupSet();
    set.matchup = matchup;
    set.order = 1;
    set.maps = [];
    const sets: MatchupSet[] = [set];
    mpData.games.forEach((game, i) => {
        const beatmap = matchup.stage!.mappool![0].slots.find(slot => slot.maps.some(map => map.beatmap!.ID === game.beatmapId))!.maps.find(map => map.beatmap!.ID === game.beatmapId);
        if (!beatmap)
            return;

        const map = new MatchupMap();
        map.set = sets[sets.length - 1];
        map.map = beatmap;
        map.order = i + 1;
        map.scores = [];
        game.scores.forEach(score => {
            let user: User | undefined = undefined;
            if (matchup.stage!.stageType === StageType.Qualifiers)
                user = matchup.teams!.flatMap(team => team.members).find(member => member.osu.userID === score.userId.toString());
            else
                user = matchup.team1!.members.find(member => member.osu.userID === score.userId.toString()) ?? matchup.team2!.members.find(member => member.osu.userID === score.userId.toString());
            if (!user)
                return;

            const matchupScore      = new MatchupScore();
            matchupScore.user       = user;
            matchupScore.score      = score.score;
            matchupScore.mods       = ((score.enabledMods ?? game.mods) | 1) ^ 1; // Remove NF from mods (the OR 1 is to ensure NM is 0 after XOR)
            matchupScore.misses     = score.countMiss;
            matchupScore.combo      = score.maxCombo;
            matchupScore.fail       = !score.pass;
            matchupScore.accuracy   = (score.count50 + 2 * score.count100 + 6 * score.count300) / Math.max(6 * (score.countMiss + score.count50 + score.count100 + score.count300), 1);
            matchupScore.fullCombo  = score.perfect ?? score.maxCombo === beatmap.beatmap!.maxCombo;

            map.scores.push(matchupScore);
        });
        if (matchup.stage!.stageType !== StageType.Qualifiers) {
            map.team1Score = map.scores
                .filter(score => matchup.team1!.members.some(member => member.osu.userID === score.user.osu.userID))
                .reduce((acc, score) => acc + score.score, 0);
            map.team2Score = map.scores
                .filter(score => matchup.team2!.members.some(member => member.osu.userID === score.user.osu.userID))
                .reduce((acc, score) => acc + score.score, 0);
            map.winner = map.team1Score > map.team2Score ? matchup.team1 : map.team2Score > map.team1Score ? matchup.team2 : undefined;
        }
        sets[sets.length - 1].maps!.push(map);

        if (matchup.stage!.stageType !== StageType.Qualifiers && (matchup.round?.mapOrder ?? matchup.stage!.mapOrder)) {
            if (map.winner === matchup.team1)
                sets[sets.length - 1].team1Score = (sets[sets.length - 1].team1Score ?? 0) + 1;
            else if (map.winner === matchup.team2)
                sets[sets.length - 1].team2Score = (sets[sets.length - 1].team2Score ?? 0) + 1;

            const setOrders = (matchup.round?.mapOrder ?? matchup.stage!.mapOrder)!.map(order => order.set).filter((set, i, arr) => arr.indexOf(set) === i).map(set => ({
                set,
                maps: (matchup.round?.mapOrder ?? matchup.stage!.mapOrder)!.filter(mapOrder => mapOrder.set === set),
            }));
            if (setOrders.find(setOrder => setOrder.set === sets.length)) {
                const setOrder = setOrders.find(setOrder => setOrder.set === sets.length)!;
                const firstTo = setOrder.maps.filter(map => map.status === MapStatus.Picked).length / 2 + 1;
                if (sets[sets.length - 1].team1Score === firstTo)
                    sets[sets.length - 1].winner = matchup.team1;
                else if (sets[sets.length - 1].team2Score === firstTo)
                    sets[sets.length - 1].winner = matchup.team2;

                if (sets[sets.length - 1].winner) {
                    const nextSet = new MatchupSet();
                    nextSet.matchup = matchup;
                    nextSet.order = sets.length + 1;
                    nextSet.maps = [];
                    sets.push(nextSet);
                }
            }
        }
    });

    matchup.sets?.forEach(async set => {
        await Promise.all(set.maps?.map(map => map.scores.map(score => score.remove())) ?? []);
        await Promise.all(set.maps?.map(map => map.remove()) ?? []);
        await set.remove();
    });

    sets.forEach(async set => {
        await set.save();
        await Promise.all(set.maps?.map(map => map.save()) ?? []);
        await Promise.all(set.maps?.flatMap(map => map.scores?.map(score => {
            score.map = map;
            return score.save();
        }) ?? []) ?? []);
    });

    matchup.sets = sets;
    if (matchup.stage!.stageType !== StageType.Qualifiers) {
        matchup.team1Score = sets.filter(map => map.team1Score && map.team2Score ? map.team1Score > map.team2Score : false).length;
        matchup.team2Score = sets.filter(map => map.team1Score && map.team2Score ? map.team2Score > map.team1Score : false).length;
        if (matchup.team1Score > matchup.team2Score)
            matchup.winner = matchup.team1;
        else if (matchup.team2Score > matchup.team1Score)
            matchup.winner = matchup.team2;

        await assignTeamsToNextMatchup(matchup.ID);
    }
    matchup.mp = mpID;
    await matchup.save();

    ctx.body = {
        success: true,
        matchup: sanitizeMatchupResponse(matchup),
    };
});

matchupRouter.$post<{ matchup: object }>("/score", isLoggedInDiscord, isCorsace, async (ctx) => {
    if (!ctx.request.body) {
        ctx.body = {
            success: false,
            error: "No request body",
        };
        return;
    }

    const obj = requiredNumberFields(ctx.request.body, ["matchID", "teamID", "setNum", "mapOrder", "userID", "score", "mods", "misses", "combo", "accuracy"]);
    if (typeof obj === "string") {
        ctx.body = {
            success: false,
            error: obj,
        };
        return;
    }

    const { matchID, teamID, setNum, mapOrder, userID, score, mods, misses, combo, accuracy } = obj;

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.mappool", "mappool")
        .innerJoinAndSelect("mappool.slots", "slot")
        .innerJoinAndSelect("slot.maps", "map")
        .innerJoinAndSelect("map.beatmap", "beatmap")
        .leftJoinAndSelect("matchup.teams", "team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("team1.manager", "team1manager")
        .leftJoinAndSelect("team1.members", "team1member")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team2.manager", "team2manager")
        .leftJoinAndSelect("team2.members", "team2member")
        .leftJoinAndSelect("matchup.sets", "set")
        .leftJoinAndSelect("set.maps", "matchupMap")
        .leftJoinAndSelect("matchupMap.scores", "score")
        .where("matchup.ID = :matchID", { matchID })
        .andWhere("stage.stageType = '0'")
        .getOne();
    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const set = matchup.sets!.find(set => set.order === setNum);
    if (!set) {
        ctx.body = {
            success: false,
            error: "Set not found",
        };
        return;
    }

    const map = set.maps!.find(map => map.order === mapOrder);
    if (!map) {
        ctx.body = {
            success: false,
            error: "Map not found",
        };
        return;
    }

    let team: Team | undefined = undefined;
    if (matchup.stage!.stageType === StageType.Qualifiers)
        team = matchup.teams!.find(team => team.ID === teamID);
    else
        team = matchup.team1?.ID === teamID ? matchup.team1 : matchup.team2?.ID === teamID ? matchup.team2 : undefined;
    if (!team) {
        ctx.body = {
            success: false,
            error: "Team not found",
        };
        return;
    }

    const user = team.members.find(member => member.ID === userID);
    if (!user) {
        ctx.body = {
            success: false,
            error: "User not found",
        };
        return;
    }

    const matchupScore      = new MatchupScore();
    matchupScore.user       = user;
    matchupScore.score      = score;
    matchupScore.mods       = mods;
    matchupScore.misses     = misses;
    matchupScore.combo      = combo;
    matchupScore.fail       = ctx.request.body.fail ?? false;
    matchupScore.accuracy   = accuracy;
    matchupScore.fullCombo  = ctx.request.body.fullCombo ?? false;
    matchupScore.map        = map;
    await matchupScore.save();

    if (matchup.stage!.stageType !== StageType.Qualifiers) {
        map.scores.push(matchupScore);
        map.team1Score = map.scores
            .filter(score => matchup.team1!.members.some(member => member.ID === score.user.ID))
            .reduce((acc, score) => acc + score.score, 0);
        map.team2Score = map.scores
            .filter(score => matchup.team2!.members.some(member => member.ID === score.user.ID))
            .reduce((acc, score) => acc + score.score, 0);
        if (map.team1Score > map.team2Score)
            map.winner = matchup.team1;
        else if (map.team2Score > map.team1Score)
            map.winner = matchup.team2;
        await map.save();

        const i = matchup.sets!.findIndex(m => m.ID === set.ID);
        const j = matchup.sets![i].maps!.findIndex(m => m.ID === map.ID);
        matchup.sets![i].maps![j] = map;
        matchup.sets![i].team1Score = matchup.sets![i].maps!.filter(map => map.team1Score && map.team2Score ? map.team1Score > map.team2Score : false).length;
        matchup.sets![i].team2Score = matchup.sets![i].maps!.filter(map => map.team1Score && map.team2Score ? map.team2Score > map.team1Score : false).length;
        matchup.team1Score = matchup.sets!.filter(set => set.team1Score && set.team2Score ? set.team1Score > set.team2Score : false).length;
        matchup.team2Score = matchup.sets!.filter(set => set.team1Score && set.team2Score ? set.team2Score > set.team1Score : false).length;
        if (matchup.team1Score > matchup.team2Score)
            matchup.winner = matchup.team1;
        else if (matchup.team2Score > matchup.team1Score)
            matchup.winner = matchup.team2;
        await matchup.save();
    }

    ctx.body = {
        success: true,
        matchup: sanitizeMatchupResponse(matchup),
    };
}); 

matchupRouter.$delete("/score/:scoreID", isLoggedInDiscord, isCorsace, async (ctx) => {
    const scoreID = parseInt(ctx.params.scoreID);
    if (isNaN(scoreID)) {
        ctx.body = {
            success: false,
            error: "Invalid score ID",
        };
        return;
    }

    const score = await MatchupScore
        .createQueryBuilder("score")
        .innerJoinAndSelect("score.map", "map")
        .innerJoinAndSelect("map.set", "set")
        .innerJoinAndSelect("set.matchup", "matchup")
        .where("score.ID = :scoreID", { scoreID })
        .getOne();
    if (!score) {
        ctx.body = {
            success: false,
            error: "Score not found",
        };
        return;
    }

    await score.remove();

    await updateMatchup(score.map.set.matchup!.ID);
    
    ctx.body = {
        success: true,
    };
});

matchupRouter.$delete("/map/:mapID", isLoggedInDiscord, isCorsace, async (ctx) => {
    const mapID = parseInt(ctx.params.mapID);
    if (isNaN(mapID)) {
        ctx.body = {
            success: false,
            error: "Invalid map ID",
        };
        return;
    }

    const map = await MatchupMap
        .createQueryBuilder("map")
        .leftJoinAndSelect("map.scores", "score")
        .innerJoinAndSelect("map.set", "set")
        .innerJoinAndSelect("set.matchup", "matchup")
        .where("map.ID = :mapID", { mapID })
        .getOne();
    if (!map) {
        ctx.body = {
            success: false,
            error: "Map not found",
        };
        return;
    }

    await Promise.all(map.scores.map(score => score.remove()));
    await map.remove();
    
    await updateMatchup(map.set.matchup!.ID);

    ctx.body = {
        success: true,
    };
});

export default matchupRouter;