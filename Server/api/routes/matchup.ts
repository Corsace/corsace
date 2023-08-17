import Router from "@koa/router";
import { Multi } from "nodesu";
import { EntityManager } from "typeorm";
import { StageType } from "../../../Interfaces/stage";
import { TournamentRoleType } from "../../../Interfaces/tournament";
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

const matchupRouter = new Router();

interface postMatchup {
    ID: number;
    isLowerBracket?: boolean;
    potentials?: boolean;
    date?: string;
    team1?: number;
    team2?: number;
    previousMatchups?: postMatchup[];
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
        .leftJoinAndSelect("matchup.maps", "map")
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
        matchup.maps!.forEach(async map => {
            map.team1Score = map.scores
                .filter(score => matchup.team1!.members.some(member => member.ID === score.user!.ID))
                .reduce((acc, score) => acc + score.score, 0);
            map.team2Score = map.scores
                .filter(score => matchup.team2!.members.some(member => member.ID === score.user!.ID))
                .reduce((acc, score) => acc + score.score, 0);
            if (map.team1Score > map.team2Score)
                map.winner = matchup.team1;
            else if (map.team2Score > map.team1Score)
                map.winner = matchup.team2;
            await map.save();
        });
        matchup.team1Score = matchup.maps!.filter(map => map.team1Score && map.team2Score ? map.team1Score > map.team2Score : false).length;
        matchup.team2Score = matchup.maps!.filter(map => map.team1Score && map.team2Score ? map.team2Score > map.team1Score : false).length;
        if (matchup.team1Score > matchup.team2Score)
            matchup.winner = matchup.team1;
        else if (matchup.team2Score > matchup.team1Score)
            matchup.winner = matchup.team2;
        await matchup.save();
    }
}

function validatePOSTMatchups (matchups: any[]): string | true {
    for (const matchup of matchups) {
        if (matchup.ID === undefined || isNaN(parseInt(matchup.ID)) || parseInt(matchup.ID) < 1)
            return `Invalid matchup ID provided: ${matchup.ID}`;

        if (matchup.date && (isNaN(parseDateOrTimestamp(matchup.date).getTime()) || parseDateOrTimestamp(matchup.date).getTime() < 0))
            return `Invalid matchup date provided: ${matchup.date}`;

        if (matchup.isLowerBracket !== undefined && typeof matchup.isLowerBracket !== "boolean")
            return `Invalid matchup isLowerBracket provided: ${matchup.isLowerBracket}`;

        if (matchup.potentials !== undefined && typeof matchup.potentials !== "boolean")
            return `Invalid matchup potentials provided: ${matchup.potentials}`;

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
}

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

    const createMatchups = async (matchups: postMatchup[], transactionManager: EntityManager): Promise<Matchup[]> => {
        const createdMatchups: Matchup[] = [];
        for (const matchup of matchups) {

            let dbMatchup = new Matchup();
            dbMatchup.isLowerBracket = matchup.isLowerBracket || false;
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

            await transactionManager.save(dbMatchup);
            idToMatchup.set(matchup.ID, dbMatchup);
            const previousMatchups = matchup.previousMatchups ? await createMatchups(matchup.previousMatchups, transactionManager) : undefined;
            if (previousMatchups)
                dbMatchup.previousMatchups = previousMatchups;

            if (matchup.potentials) {
                dbMatchup.potentials = [];
                const teams = previousMatchups?.map(m => {
                    if (m.winner)
                        return [m.winner];

                    const teamArray: Team[] = [];
                    if (m.team1)
                        teamArray.push(m.team1);
                    if (m.team2)
                        teamArray.push(m.team2);

                    return teamArray;
                }) || [];
                if (teams.flat().length < 2)
                    for (let i = 0; i < 4; i++) {
                        const potential = new Matchup();
                        potential.date = dbMatchup.date;
                        if (ctx.state.stage)
                            potential.stage = ctx.state.stage;
                        else
                            potential.round = ctx.state.round;
                        await transactionManager.save(potential);
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
                                    await transactionManager.save(potential);
                                    dbMatchup.potentials.push(potential);
                                }
                            }
                        }
                    }
            }
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
        ctx.body = {
            success: false,
            error: err instanceof Error ? err.message : err,
        };
    }
});

matchupRouter.post("/mp", isLoggedInDiscord, isCorsace, async (ctx) => {
    if (!ctx.request.body) {
        ctx.body = {
            error: "No request body",
        };
        return;
    }

    const obj = requiredNumberFields(ctx.request.body, ["mpID", "matchID"]);
    if (typeof obj === "string") {
        ctx.body = {
            error: obj,
        };
        return;
    }

    const { mpID, matchID } = obj;

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.mappool", "mappool")
        .innerJoinAndSelect("mappool.slots", "slot")
        .innerJoinAndSelect("slot.maps", "map")
        .innerJoinAndSelect("map.beatmap", "beatmap")
        .leftJoinAndSelect("matchup.teams", "team")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("team1.manager", "team1manager")
        .leftJoinAndSelect("team1.members", "team1member")
        .leftJoinAndSelect("team2.manager", "team2manager")
        .leftJoinAndSelect("team2.members", "team2member")
        .leftJoinAndSelect("matchup.maps", "matchupMap")
        .leftJoinAndSelect("matchupMap.scores", "score")
        .where("matchup.ID = :matchID", { matchID })
        .getOne();
    if (!matchup) {
        ctx.body = {
            error: "Matchup not found",
        };
        return;
    }

    const mpData = await osuClient.multi.getMatch(mpID) as Multi;
    const maps: MatchupMap[] = [];
    mpData.games.forEach((game, i) => {
        const beatmap = matchup.stage!.mappool![0].slots.find(slot => slot.maps.some(map => map.beatmap!.ID === game.beatmapId))!.maps.find(map => map.beatmap!.ID === game.beatmapId);
        if (!beatmap)
            return;

        const map = new MatchupMap;
        map.matchup = matchup;
        map.map = beatmap;
        map.order = i + 1;
        map.scores = [];
        game.scores.forEach(score => {
            let user: User | undefined = undefined;
            if (matchup.stage!.stageType === StageType.Qualifiers)
                user = matchup.teams!.flatMap(team => team.members).find(member => member.osu.userID === score.userId.toString());
            else
                user = matchup.team1!.members.find(member => member.osu.userID === score.userId.toString()) || matchup.team2!.members.find(member => member.osu.userID === score.userId.toString());
            if (!user)
                return;

            const matchupScore      = new MatchupScore;
            matchupScore.user       = user;
            matchupScore.score      = score.score;
            matchupScore.mods       = ((score.enabledMods || game.mods) | 1) ^ 1; // Remove NF from mods (the OR 1 is to ensure NM is 0 after XOR)
            matchupScore.misses     = score.countMiss;
            matchupScore.combo      = score.maxCombo;
            matchupScore.fail       = !score.pass;
            matchupScore.accuracy   = (score.count50 + 2 * score.count100 + 6 * score.count300) / Math.max(6 * (score.countMiss + score.count50 + score.count100 + score.count300), 1);
            matchupScore.fullCombo  = score.perfect || score.maxCombo === beatmap.beatmap!.maxCombo;

            map.scores.push(matchupScore);
        });
        if (matchup.stage!.stageType !== StageType.Qualifiers) {
            map.team1Score = map.scores
                .filter(score => matchup.team1!.members.some(member => member.osu.userID === score.user!.osu.userID))
                .reduce((acc, score) => acc + score.score, 0);
            map.team2Score = map.scores
                .filter(score => matchup.team2!.members.some(member => member.osu.userID === score.user!.osu.userID))
                .reduce((acc, score) => acc + score.score, 0);
        }
        maps.push(map);
    });

    matchup.maps?.forEach(async map => {
        await Promise.all(map.scores.map(score => score.remove()));
        await map.remove();
    });

    maps.forEach(async map => {
        await map.save();
        await Promise.all(map.scores?.map(score => {
            score.map = map;
            return score.save();
        }) || []);
    });

    matchup.maps = maps;
    if (matchup.stage!.stageType !== StageType.Qualifiers) {
        matchup.team1Score = maps.filter(map => map.team1Score && map.team2Score ? map.team1Score > map.team2Score : false).length;
        matchup.team2Score = maps.filter(map => map.team1Score && map.team2Score ? map.team2Score > map.team1Score : false).length;
        if (matchup.team1Score > matchup.team2Score)
            matchup.winner = matchup.team1;
        else if (matchup.team2Score > matchup.team1Score)
            matchup.winner = matchup.team2;
    }
    matchup.mp = mpID;
    await matchup.save();

    ctx.body = {
        success: true,
    };
});

matchupRouter.post("/score", isLoggedInDiscord, isCorsace, async (ctx) => {
    if (!ctx.request.body) {
        ctx.body = {
            error: "No request body",
        };
        return;
    }

    const obj = requiredNumberFields(ctx.request.body, ["matchID", "teamID", "mapOrder", "userID", "score", "mods", "misses", "combo", "accuracy"]);
    if (typeof obj === "string") {
        ctx.body = {
            error: obj,
        };
        return;
    }

    const { matchID, teamID, mapOrder, userID, score, mods, misses, combo, accuracy } = obj;

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
        .leftJoinAndSelect("matchup.maps", "matchupMap")
        .leftJoinAndSelect("matchupMap.scores", "score")
        .where("matchup.ID = :matchID", { matchID })
        .andWhere("stage.stageType = '0'")
        .getOne();
    if (!matchup) {
        ctx.body = {
            error: "Matchup not found",
        };
        return;
    }

    const map = matchup.maps!.find(map => map.order === mapOrder);
    if (!map) {
        ctx.body = {
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
            error: "Team not found",
        };
        return;
    }

    const user = team.members.find(member => member.ID === userID);
    if (!user) {
        ctx.body = {
            error: "User not found",
        };
        return;
    }

    const matchupScore = new MatchupScore;
    matchupScore.user = user;
    matchupScore.score = score;
    matchupScore.mods = mods;
    matchupScore.misses = misses;
    matchupScore.combo = combo;
    matchupScore.fail = ctx.request.body.fail || false;
    matchupScore.accuracy = accuracy;
    matchupScore.fullCombo = ctx.request.body.fullCombo || false;
    matchupScore.map = map;
    await matchupScore.save();

    if (matchup.stage!.stageType !== StageType.Qualifiers) {
        map.team1Score = map.scores
            .filter(score => matchup.team1!.members.some(member => member.ID === score.user!.ID))
            .reduce((acc, score) => acc + score.score, 0);
        map.team2Score = map.scores
            .filter(score => matchup.team2!.members.some(member => member.ID === score.user!.ID))
            .reduce((acc, score) => acc + score.score, 0);
        if (map.team1Score > map.team2Score)
            map.winner = matchup.team1;
        else if (map.team2Score > map.team1Score)
            map.winner = matchup.team2;
        await map.save();

        const i = matchup.maps?.findIndex(m => m.ID === map.ID);
        matchup.maps![i!] = map;    
        matchup.team1Score = matchup.maps!.filter(map => map.team1Score && map.team2Score ? map.team1Score > map.team2Score : false).length;
        matchup.team2Score = matchup.maps!.filter(map => map.team1Score && map.team2Score ? map.team2Score > map.team1Score : false).length;
        if (matchup.team1Score > matchup.team2Score)
            matchup.winner = matchup.team1;
        else if (matchup.team2Score > matchup.team1Score)
            matchup.winner = matchup.team2;
        await matchup.save();
    }

    ctx.body = {
        success: true,
    };
}); 

matchupRouter.delete("/score/:scoreID", isLoggedInDiscord, isCorsace, async (ctx) => {
    const scoreID = parseInt(ctx.params.scoreID);
    if (isNaN(scoreID)) {
        ctx.body = {
            error: "Invalid score ID",
        };
        return;
    }

    const score = await MatchupScore
        .createQueryBuilder("score")
        .leftJoinAndSelect("score.map", "map")
        .leftJoinAndSelect("map.matchup", "matchup")
        .where("score.ID = :scoreID", { scoreID })
        .getOne();
    if (!score) {
        ctx.body = {
            error: "Score not found",
        };
        return;
    }

    await score.remove();

    await updateMatchup(score.map!.matchup!.ID);
    
    ctx.body = {
        success: true,
    };
});

matchupRouter.delete("/map/:mapID", isLoggedInDiscord, isCorsace, async (ctx) => {
    const mapID = parseInt(ctx.params.mapID);
    if (isNaN(mapID)) {
        ctx.body = {
            error: "Invalid map ID",
        };
        return;
    }

    const map = await MatchupMap
        .createQueryBuilder("map")
        .leftJoinAndSelect("map.scores", "score")
        .leftJoinAndSelect("map.matchup", "matchup")
        .where("map.ID = :mapID", { mapID })
        .getOne();
    if (!map) {
        ctx.body = {
            error: "Map not found",
        };
        return;
    }

    await Promise.all(map.scores.map(score => score.remove()));
    await map.remove();
    
    await updateMatchup(map.matchup!.ID);

    ctx.body = {
        success: true,
    };
});

export default matchupRouter;