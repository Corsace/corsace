import ormConfig from "../../../ormconfig";
import axios from "axios";
import { CorsaceRouter } from "../../corsaceRouter";
import { Multi } from "nodesu";
import { Brackets } from "typeorm";
import { StageType } from "../../../Interfaces/stage";
import { TournamentRoleType } from "../../../Interfaces/tournament";
import { MapStatus, Matchup as MatchupInterface } from "../../../Interfaces/matchup";
import { Matchup, MatchupWithRelationIDs } from "../../../Models/tournaments/matchup";
import { MatchupMap } from "../../../Models/tournaments/matchupMap";
import { MatchupScore } from "../../../Models/tournaments/matchupScore";
import { Team } from "../../../Models/tournaments/team";
import { User } from "../../../Models/user";
import { isCorsace, isLoggedInDiscord } from "../../middleware";
import { validateTournament, hasRoles, validateStageOrRound } from "../../middleware/tournament";
import { osuClient } from "../../osu";
import { parseDateOrTimestamp } from "../../utils/dateParse";
import assignTeamsToNextMatchup from "../../functions/tournaments/matchups/assignTeamsToNextMatchup";
import { Stage } from "../../../Models/tournaments/stage";
import { config } from "node-config-ts";
import { MatchupSet } from "../../../Models/tournaments/matchupSet";
import dbMatchupToInterface from "../../functions/tournaments/matchups/dbMatchupToInterface";
import { ResponseBody, TournamentStageState, TournamentState } from "koa";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { Round } from "../../../Models/tournaments/round";
import { createHash } from "crypto";
import { Tournament } from "../../../Models/tournaments/tournament";
import { publish } from "../../functions/centrifugo";

const matchupRouter  = new CorsaceRouter();

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
                winner: map.winner,
                scores: map.scores?.map(score => ({
                    ID: score.ID,
                    user: score.user,
                    score: score.score,
                    mods: score.mods,
                    misses: score.misses,
                    combo: score.combo,
                    fail: score.fail,
                    accuracy: score.accuracy,
                    fullCombo: score.fullCombo,
                })) ?? [],
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
                const team1Score = map.scores?.filter(score => matchup.team1!.members.some(member => member.ID === score.user.ID))
                    .reduce((acc, score) => acc + score.score, 0) ?? 0;
                const team2Score = map.scores?.filter(score => matchup.team2!.members.some(member => member.ID === score.user.ID))
                    .reduce((acc, score) => acc + score.score, 0) ?? 0;

                if (team1Score > team2Score)
                    map.winner = matchup.team1;
                else if (team2Score > team1Score)
                    map.winner = matchup.team2;

                await map.save();
            });

            set.team1Score = matchup.team1 ? set.maps!.filter(map => map.winner?.ID === matchup.team1!.ID).length : 0;
            set.team2Score = matchup.team2 ? set.maps!.filter(map => map.winner?.ID === matchup.team2!.ID).length : 0;

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

interface postMatchup {
    ID: number;
    matchID: string;
    date: string;
    stageID: number;
    isLowerBracket?: boolean;
    createPotentials?: boolean;
    team1?: number;
    team2?: number;
    loserNextMatchupID?: number;
    winnerNextMatchupID?: number;
}

function validatePOSTMatchups (matchups: Partial<postMatchup>[]): asserts matchups is postMatchup[] {
    for (const matchup of matchups) {
        if (typeof matchup.ID !== "number" || isNaN(matchup.ID) || matchup.ID < 1)
            throw new Error(`Invalid matchup ID provided: ${matchup.ID}`);

        if (typeof matchup.matchID !== "string" || matchup.matchID.length === 0)
            throw new Error(`Invalid matchup matchID provided: ${matchup.matchID}`);

        if (matchup.date && (isNaN(parseDateOrTimestamp(matchup.date).getTime()) || parseDateOrTimestamp(matchup.date).getTime() < 0))
            throw new Error(`Invalid matchup date provided: ${matchup.date}`);

        if (typeof matchup.stageID !== "number" || isNaN(matchup.stageID) || matchup.stageID < 1)
            throw new Error(`Invalid matchup stageID provided: ${matchup.stageID}`);

        if (matchup.isLowerBracket !== undefined && typeof matchup.isLowerBracket !== "boolean")
            throw new Error(`Invalid matchup isLowerBracket provided: ${matchup.isLowerBracket}`);

        if (matchup.createPotentials !== undefined && typeof matchup.createPotentials !== "boolean")
            throw new Error(`Invalid matchup createPotentials provided: ${matchup.createPotentials}`);

        if (matchup.team1 !== undefined && (typeof matchup.team1 !== "number" || isNaN(matchup.team1) || matchup.team1 < 1))
            throw new Error(`Invalid matchup team1 provided: ${matchup.team1}`);

        if (matchup.team2 !== undefined && (typeof matchup.team2 !== "number" || isNaN(matchup.team2) || matchup.team2 < 1))
            throw new Error(`Invalid matchup team2 provided: ${matchup.team2}`);

        if (matchup.loserNextMatchupID !== undefined && (typeof matchup.loserNextMatchupID !== "number" || isNaN(matchup.loserNextMatchupID) || matchup.loserNextMatchupID < 1))
            throw new Error(`Invalid matchup loserNextMatchupID provided: ${matchup.loserNextMatchupID}`);

        if (matchup.loserNextMatchupID === matchup.ID)
            throw new Error("Matchup cannot be its own loserNextMatchupID");

        if (matchup.loserNextMatchupID !== undefined && !matchups.some(m => m.ID === matchup.loserNextMatchupID))
            throw new Error(`Matchup with ID ${matchup.loserNextMatchupID} not found in provided matchups`);

        if (matchup.winnerNextMatchupID !== undefined && (typeof matchup.winnerNextMatchupID !== "number" || isNaN(matchup.winnerNextMatchupID) || matchup.winnerNextMatchupID < 1))
            throw new Error(`Invalid matchup winnerNextMatchupID provided: ${matchup.winnerNextMatchupID}`);

        if (matchup.winnerNextMatchupID === matchup.ID)
            throw new Error("Matchup cannot be its own winnerNextMatchupID");

        if (matchup.winnerNextMatchupID !== undefined && !matchups.some(m => m.ID === matchup.winnerNextMatchupID))
            throw new Error(`Matchup with ID ${matchup.winnerNextMatchupID} not found in provided matchups`);
    }

    if (matchups.some((v, i, arr) => arr.findIndex(t => t.ID === v.ID) !== i))
        throw new Error("Duplicate matchup IDs provided");

    // See if any id shows up more than two times as a loserNextMatchupID or winnerNextMatchupID
    const loserNextMatchupIDs = matchups.map(m => m.loserNextMatchupID).filter(id => id !== undefined) as number[];
    const winnerNextMatchupIDs = matchups.map(m => m.winnerNextMatchupID).filter(id => id !== undefined) as number[];
    if (loserNextMatchupIDs.some((v, i, arr) => arr.filter(t => t === v).length > 2))
        throw new Error(`Matchup IDs show up more than twice as loserNextMatchupID: ${loserNextMatchupIDs.filter((v, i, arr) => arr.filter(t => t === v).length > 2).join(", ")}`);
    if (winnerNextMatchupIDs.some((v, i, arr) => arr.filter(t => t === v).length > 2))
        throw new Error(`Matchup IDs show up more than twice as winnerNextMatchupID: ${winnerNextMatchupIDs.filter((v, i, arr) => arr.filter(t => t === v).length > 2).join(", ")}`);
    const allNextMatchupIDs = [...loserNextMatchupIDs, ...winnerNextMatchupIDs];
    if (allNextMatchupIDs.some((v, i, arr) => arr.filter(t => t === v).length > 2))
        throw new Error(`Matchup IDs show up more than twice as any form of nextMatchupID: ${allNextMatchupIDs.filter((v, i, arr) => arr.filter(t => t === v).length > 2).join(", ")}`);
}

matchupRouter.$get<{ matchup: MatchupInterface }>("/:matchupID", async (ctx) => {
    const dbMatchup: MatchupWithRelationIDs = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.streamer", "streamer")
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID })
        .loadAllRelationIds({
            relations: ["winner", "round", "stage", "team1", "team2", "teams", "commentators", "sets"],
        })
        .getOne() as any;

    if (!dbMatchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found.",
        };
        return;
    }

    ctx.body = {
        success: true,
        matchup: await dbMatchupToInterface(dbMatchup, true, true),
    };
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
        .leftJoinAndSelect("team1.captain", "captain1")
        .leftJoinAndSelect("team2.captain", "captain2")
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

// Advanced Scene Switcher doesn't support PUT
matchupRouter.$post("/:matchupID/ipcState", async (ctx) => {
    const ipcState = ctx.request.body?.ipcState;
    if (!ipcState) {
        ctx.body = {
            success: false,
            error: "No ipcState provided",
        };
        return;
    }

    const key = ctx.query.key as string;
    if (!key) {
        ctx.body = {
            success: false,
            error: "No key provided",
        };
        return;
    }

    const hash = createHash("sha512");
    hash.update(key);
    const hashedKey = hash.digest("hex");

    const isKeyValid = await Tournament
        .createQueryBuilder("tournament")
        .leftJoin("tournament.stages", "stage")
        .leftJoin("stage.matchups", "matchup")
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID })
        .andWhere("tournament.key = :key", { key: hashedKey })
        .getExists();

    if (!isKeyValid) {
        ctx.body = {
            success: false,
            error: "Invalid key",
        };
        return;
    }

    publish(`matchup:${ctx.params.matchupID}`, {
        type: "ipcState",
        ipcState,
    });
    ctx.body = {
        success: true,
    };
});

matchupRouter.$post<{ matchups: Matchup[] }, TournamentStageState>("/create", validateTournament, async (ctx) => {
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
    const idToStages = new Map<number, Stage>();

    try {
        await ormConfig.transaction(async transactionManager => {
            const createdMatchups: Matchup[] = [];
            // Initial creation and saving of matchups
            for (const matchup of matchups) {
                const dbMatchup = new Matchup();
                dbMatchup.matchID = matchup.matchID;
                dbMatchup.date = matchup.date ? parseDateOrTimestamp(matchup.date) : new Date();
                dbMatchup.isLowerBracket = matchup.isLowerBracket ?? false;

                const stage = idToStages.get(matchup.stageID) ?? await transactionManager.findOne(Stage, { where: { ID: matchup.stageID }});
                if (!stage) {
                    ctx.body = {
                        success: false,
                        error: `Stage with ID ${matchup.stageID} not found`,
                    };
                    return;
                }
                idToStages.set(stage.ID, stage);
                dbMatchup.stage = stage;

                if (matchup.team1) {
                    const team1 = await transactionManager.findOne(Team, { where: { ID: matchup.team1 }});
                    if (!team1) {
                        ctx.body = {
                            success: false,
                            error: `Team1 with ID ${matchup.team1} not found`,
                        };
                        return;
                    }
                    dbMatchup.team1 = team1;
                }

                if (matchup.team2) {
                    const team2 = await transactionManager.findOne(Team, { where: { ID: matchup.team2 }});
                    if (!team2) {
                        ctx.body = {
                            success: false,
                            error: `Team2 with ID ${matchup.team2} not found`,
                        };
                        return;
                    }
                    dbMatchup.team2 = team2;
                }

                await transactionManager.save(dbMatchup);
                idToMatchup.set(matchup.ID, dbMatchup);
            }

            // Assigning previous matchups and potentials
            for (const matchup of matchups) {
                const dbMatchup = idToMatchup.get(matchup.ID)!;
                if (matchup.loserNextMatchupID) {
                    const loserNextMatchup = idToMatchup.get(matchup.loserNextMatchupID);
                    if (!loserNextMatchup)
                        throw new Error(`Matchup with ID ${matchup.loserNextMatchupID} not found`);
                    dbMatchup.loserNextMatchup = loserNextMatchup;
                }

                if (matchup.winnerNextMatchupID) {
                    const winnerNextMatchup = idToMatchup.get(matchup.winnerNextMatchupID);
                    if (!winnerNextMatchup)
                        throw new Error(`Matchup with ID ${matchup.winnerNextMatchupID} not found`);
                    dbMatchup.winnerNextMatchup = winnerNextMatchup;
                }

                if (matchup.createPotentials) {
                    if (dbMatchup.team1 && dbMatchup.team2)
                        throw new Error(`Matchup ${matchup.ID} already has both teams assigned`);

                    const currMatchTeams: Team[] = [];
                    if (dbMatchup.team1)
                        currMatchTeams.push(dbMatchup.team1);
                    if (dbMatchup.team2)
                        currMatchTeams.push(dbMatchup.team2);

                    const loserPrevMatchupTeams: Team[] = [];
                    const loserPrevMatchups = matchups.filter(m => m.loserNextMatchupID === matchup.ID).map(m => idToMatchup.get(m.ID)!);
                    for (const loserPrevMatchup of loserPrevMatchups) {
                        if (loserPrevMatchup.team1)
                            loserPrevMatchupTeams.push(loserPrevMatchup.team1);
                        if (loserPrevMatchup.team2)
                            loserPrevMatchupTeams.push(loserPrevMatchup.team2);
                    }

                    const winnerPrevMatchupTeams: Team[] = [];
                    const winnerPrevMatchups = matchups.filter(m => m.winnerNextMatchupID === matchup.ID).map(m => idToMatchup.get(m.ID)!);
                    for (const winnerPrevMatchup of winnerPrevMatchups) {
                        if (winnerPrevMatchup.team1)
                            winnerPrevMatchupTeams.push(winnerPrevMatchup.team1);
                        if (winnerPrevMatchup.team2)
                            winnerPrevMatchupTeams.push(winnerPrevMatchup.team2);
                    }

                    const teamArr: Team[][] = [currMatchTeams, loserPrevMatchupTeams, winnerPrevMatchupTeams];

                    dbMatchup.potentials = [];
                    if (teamArr.flat().length < 2) // If there are less than 2 teams in total, it's not feasible to create potentials
                        for (let i = 0; i < 4; i++) {
                            const potential = new Matchup();
                            potential.matchID = `${dbMatchup.matchID}${String.fromCharCode("A".charCodeAt(0) + dbMatchup.potentials.length)}`;
                            potential.date = dbMatchup.date;
                            potential.stage = dbMatchup.stage;
                            dbMatchup.potentials.push(potential);
                        }
                    else
                        for (let i = 0; i < teamArr.length; i++) { // Iterate each matchup
                            for (let j = i + 1; j < teamArr.length; j++) { // Iterate each matchup not current focus
                                for (const team of teamArr[i]) { // Iterate each team in current matchup
                                    for (const team2 of teamArr[j]) { // Iterate each team in other matchup
                                        const potential = new Matchup();
                                        potential.matchID = `${dbMatchup.matchID}${String.fromCharCode("A".charCodeAt(0) + dbMatchup.potentials.length)}`;
                                        potential.date = dbMatchup.date;
                                        potential.team1 = team;
                                        potential.team2 = team2;
                                        potential.isLowerBracket = dbMatchup.isLowerBracket;
                                        potential.stage = dbMatchup.stage;
                                        dbMatchup.potentials.push(potential);
                                    }
                                }
                            }
                            if (currMatchTeams.length > 0) // If current matchup has teams, we only need to iterate the teams in the current matchup since it's impossible for them to not be in the current matchup now
                                break;
                        }
                    await transactionManager.save(dbMatchup.potentials);
                }

                await transactionManager.save(dbMatchup);
                createdMatchups.push(dbMatchup);
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
        .leftJoinAndSelect("team.captain", "captain")
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

matchupRouter.$post<{ matchup: Matchup }, TournamentState>("/assignStaff", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer]), async (ctx) => {
    const tournament = ctx.state.tournament;
    const matchupID = ctx.request.body?.matchupID;
    if (!matchupID || isNaN(parseInt(matchupID))) {
        ctx.body = {
            success: false,
            error: "No matchup ID provided",
        };
        return;
    }

    const roleType = ctx.request.body?.roleType;
    if (!roleType || isNaN(parseInt(roleType))) {
        ctx.body = {
            success: false,
            error: "No role type provided",
        };
        return;
    }
    if (roleType !== TournamentRoleType.Referees && roleType !== TournamentRoleType.Commentators && roleType !== TournamentRoleType.Streamers) {
        ctx.body = {
            success: false,
            error: "Invalid role type provided",
        };
        return;
    }

    const staff = ctx.request.body?.staff;
    if (!staff) {
        ctx.body = {
            success: false,
            error: "No staff ID provided",
        };
        return;
    }

    if (Array.isArray(staff)) {
        if (staff.some(s => isNaN(parseInt(s)))) {
            ctx.body = {
                success: false,
                error: "Invalid staff ID provided",
            };
            return;
        } else if (roleType !== TournamentRoleType.Commentators) {
            ctx.body = {
                success: false,
                error: "Only commentators can have multiple staff members",
            };
            return;
        }
    } else if (isNaN(parseInt(staff))) {
        ctx.body = {
            success: false,
            error: "Invalid staff ID provided",
        };
        return;
    }

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .leftJoin("matchup.round", "round")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.commentators", "commentators")
        .leftJoinAndSelect("matchup.streamer", "streamer")
        .where("matchup.ID = :matchupID", { matchupID })
        .andWhere("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    if (Array.isArray(staff)) {
        if (staff.length === 0) {
            matchup.commentators = [];
            await matchup.save();
            ctx.body = {
                success: true,
                matchup,
            };
            return;
        }

        const staffMembers = await User
            .createQueryBuilder("user")
            .where("user.ID IN (:...staff)", { staff })
            .getMany();
        if (staffMembers.length !== staff.length) {
            ctx.body = {
                success: false,
                error: `Some staff members were not found. The only members found in the database were ${staffMembers.map(s => s.osu.username).join(", ")}. Perhaps they are not logged in?`,
            };
            return;
        }
        matchup.commentators = staffMembers;
    } else {
        const staffMember = await User
            .createQueryBuilder("user")
            .where("user.ID = :staff", { staff })
            .getOne();
        if (!staffMember) {
            ctx.body = {
                success: false,
                error: "Staff member not found. Perhaps they are not logged in?",
            };
            return;
        }
        if (roleType === TournamentRoleType.Referees)
            matchup.referee = staffMember;
        else if (roleType === TournamentRoleType.Commentators)
            matchup.commentators = [...(matchup.commentators ?? []), staffMember];
        else if (roleType === TournamentRoleType.Streamers)
            matchup.streamer = staffMember;
    }

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

    const baseMatchup = await Matchup
        .createQueryBuilder("matchup")
        .where("matchup.ID = :ID", { ID: matchID })
        .getOne();
    if (!baseMatchup) {
        ctx.body = {
            success: false,
            error: "Base matchup not found",
        };
        return;
    }

    await ormConfig.transaction(async (manager) => {
        const matchupQ: Omit<Matchup, "round" | "stage" | "teams" | "team1" | "team2"> & { round: number | null; stage: number; teams: number[]; team1: number | null; team2: number | null } = await manager
            .createQueryBuilder(Matchup, "matchup")
            .leftJoinAndSelect("matchup.sets", "set")
            .leftJoinAndSelect("set.maps", "map")
            .leftJoinAndSelect("map.scores", "score")
            .where("matchup.ID = :matchID", { matchID })
            .loadAllRelationIds({
                relations: ["round", "stage", "team1", "team2", "teams"],
            })
            .getOne() as any;
        if (!matchupQ) {
            ctx.body = {
                success: false,
                error: "Matchup not found",
            };
            return;
        }

        const teamIds = new Set<number>();
        if (matchupQ.team1) teamIds.add(matchupQ.team1);
        if (matchupQ.team2) teamIds.add(matchupQ.team2);
        for (const team of matchupQ.teams)
            teamIds.add(team);
        const teamQuery = teamIds.size === 0 ? [] : await manager
            .createQueryBuilder(Team, "team")
            .innerJoinAndSelect("team.members", "members")
            .where("team.ID IN (:...teamIds)", { teamIds: Array.from(teamIds) })
            .getMany();
        const team1 = matchupQ.team1 ? teamQuery.find(team => team.ID === matchupQ.team1) : null;
        const team2 = matchupQ.team2 ? teamQuery.find(team => team.ID === matchupQ.team2) : null;
        const teams = teamQuery.filter(team => matchupQ.teams.includes(team.ID));

        const roundOrStage: Round | Stage | null = matchupQ.round ?
            await manager
                .createQueryBuilder(Round, "round")
                .leftJoinAndSelect("round.mapOrder", "mapOrder")
                .where("round.ID = :ID", { ID: matchupQ.round })
                .getOne() :
            matchupQ.stage ?
                await manager
                    .createQueryBuilder(Stage, "stage")
                    .leftJoinAndSelect("stage.mapOrder", "mapOrder")
                    .where("stage.ID = :ID", { ID: matchupQ.stage })
                    .getOne() : null;
        if (!roundOrStage) {
            ctx.body = {
                success: false,
                error: "Round or Stage not found",
            };
            return;
        }

        const mappools = await manager
            .createQueryBuilder(Mappool, "mappool")
            .innerJoinAndSelect("mappool.slots", "slots")
            .innerJoinAndSelect("slots.maps", "maps")
            .leftJoinAndSelect("maps.beatmap", "map")
            .leftJoinAndSelect("map.beatmapset", "beatmapset")
            .where(`mappool.${roundOrStage instanceof Round ? "round" : "stage"}ID = :ID`, { ID: roundOrStage.ID })
            .getMany();

        const mpData = await osuClient.multi.getMatch(mpID) as Multi;
        const set = new MatchupSet();
        set.matchup = baseMatchup;
        set.order = 1;
        set.maps = [];
        const sets: MatchupSet[] = [set];
        mpData.games.forEach((game, i) => {
            const beatmap = mappools.flatMap(pool => pool.slots).find(slot => slot.maps.some(map => map.beatmap!.ID === game.beatmapId))!.maps.find(map => map.beatmap!.ID === game.beatmapId);
            if (!beatmap)
                return;

            const map = new MatchupMap();
            map.set = sets[sets.length - 1];
            map.map = beatmap;
            map.order = i + 1;
            map.scores = [];
            game.scores.forEach(score => {
                let user: User | undefined = undefined;
                if (roundOrStage instanceof Stage && roundOrStage.stageType === StageType.Qualifiers)
                    user = teams.flatMap(team => team.members).find(member => member.osu.userID === score.userId.toString());
                else
                    user = team1?.members.find(member => member.osu.userID === score.userId.toString()) ?? team2?.members.find(member => member.osu.userID === score.userId.toString());
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

                map.scores!.push(matchupScore);
            });
            if (roundOrStage instanceof Stage && roundOrStage.stageType !== StageType.Qualifiers) {
                const team1Score = map.scores
                    .filter(score => team1?.members.some(member => member.osu.userID === score.user.osu.userID))
                    .reduce((acc, score) => acc + score.score, 0);
                const team2Score = map.scores
                    .filter(score => team2?.members.some(member => member.osu.userID === score.user.osu.userID))
                    .reduce((acc, score) => acc + score.score, 0);
                map.winner = team1Score > team2Score ? team1 : team2Score > team1Score ? team2 : undefined;
            }
            sets[sets.length - 1].maps!.push(map);

            if (roundOrStage instanceof Stage && roundOrStage.stageType !== StageType.Qualifiers && roundOrStage.mapOrder) {
                if (map.winner === team1)
                    sets[sets.length - 1].team1Score = (sets[sets.length - 1].team1Score ?? 0) + 1;
                else if (map.winner === team2)
                    sets[sets.length - 1].team2Score = (sets[sets.length - 1].team2Score ?? 0) + 1;

                const setOrders = roundOrStage.mapOrder.map(order => order.set).filter((orderSet, j, arr) => arr.indexOf(orderSet) === j).map(orderSet => ({
                    set: orderSet,
                    maps: roundOrStage.mapOrder!.filter(mapOrder => mapOrder.set === orderSet),
                }));
                if (setOrders.find(setOrder => setOrder.set === sets.length)) {
                    const setOrder = setOrders.find(o => o.set === sets.length)!;
                    const firstTo = setOrder.maps.filter(mapOrder => mapOrder.status === MapStatus.Picked).length / 2 + 1;
                    if (sets[sets.length - 1].team1Score === firstTo)
                        sets[sets.length - 1].winner = team1;
                    else if (sets[sets.length - 1].team2Score === firstTo)
                        sets[sets.length - 1].winner = team2;

                    if (sets[sets.length - 1].winner && setOrders.find(o => o.set === sets.length + 1)) {
                        const nextSet = new MatchupSet();
                        nextSet.matchup = baseMatchup;
                        nextSet.order = sets.length + 1;
                        nextSet.maps = [];
                        sets.push(nextSet);
                    }
                }
            }
        });

        matchupQ.sets?.forEach(async matchupSet => {
            await Promise.all(matchupSet.maps?.map(map => map.scores?.map(score => manager.remove(score)) ?? []) ?? []);
            await Promise.all(matchupSet.maps?.map(map => manager.remove(map)) ?? []);
            await manager.remove(matchupSet);
        });

        sets.forEach(async matchupSet => {
            await manager.save(matchupSet);
            await Promise.all(matchupSet.maps?.map(map => manager.save(map)) ?? []);
            await Promise.all(matchupSet.maps?.flatMap(map => map.scores?.map(score => {
                score.map = map;
                return manager.save(score);
            }) ?? []) ?? []);
        });

        baseMatchup.sets = sets;
        if (roundOrStage instanceof Stage && roundOrStage.stageType !== StageType.Qualifiers) {
            baseMatchup.team1Score = sets.filter(map => map.team1Score > map.team2Score).length;
            baseMatchup.team2Score = sets.filter(map => map.team2Score > map.team1Score).length;
            if (baseMatchup.team1Score > baseMatchup.team2Score)
                baseMatchup.winner = team1;
            else if (baseMatchup.team2Score > baseMatchup.team1Score)
                baseMatchup.winner = team2;
        }
        baseMatchup.mp = mpID;
        await manager.save(baseMatchup);
    });

    await assignTeamsToNextMatchup(baseMatchup.ID);

    ctx.body = {
        success: true,
        matchup: sanitizeMatchupResponse(baseMatchup),
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
        .leftJoinAndSelect("team.captain", "captain")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("team1.captain", "team1captain")
        .leftJoinAndSelect("team1.members", "team1member")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team2.captain", "team2captain")
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

    const set = matchup.sets!.find(matchupSet => matchupSet.order === setNum);
    if (!set) {
        ctx.body = {
            success: false,
            error: "Set not found",
        };
        return;
    }

    const map = set.maps!.find(setMap => setMap.order === mapOrder);
    if (!map) {
        ctx.body = {
            success: false,
            error: "Map not found",
        };
        return;
    }

    let team: Team | undefined = undefined;
    if (matchup.stage!.stageType === StageType.Qualifiers)
        team = matchup.teams!.find(t => t.ID === teamID);
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
        if (!map.scores)
            map.scores = [];
        map.scores.push(matchupScore);
        const team1Score = map.scores
            .filter(mapScore => matchup.team1!.members.some(member => member.ID === mapScore.user.ID))
            .reduce((acc, mapScore) => acc + mapScore.score, 0);
        const team2Score = map.scores
            .filter(mapScore => matchup.team2!.members.some(member => member.ID === mapScore.user.ID))
            .reduce((acc, mapScore) => acc + mapScore.score, 0);
        if (team1Score > team2Score)
            map.winner = matchup.team1;
        else if (team2Score > team1Score)
            map.winner = matchup.team2;
        await map.save();

        const i = matchup.sets!.findIndex(m => m.ID === set.ID);
        const j = matchup.sets![i].maps!.findIndex(m => m.ID === map.ID);
        matchup.sets![i].maps![j] = map;
        matchup.sets![i].team1Score = matchup.team1 ? matchup.sets![i].maps!.filter(setMap => setMap.winner?.ID === matchup.team1!.ID).length : 0;
        matchup.sets![i].team2Score = matchup.team2 ? matchup.sets![i].maps!.filter(setMap => setMap.winner?.ID === matchup.team2!.ID).length : 0;
        matchup.team1Score = matchup.sets!.filter(matchupSet => matchupSet.team1Score && matchupSet.team2Score ? matchupSet.team1Score > matchupSet.team2Score : false).length;
        matchup.team2Score = matchup.sets!.filter(matchupSet => matchupSet.team1Score && matchupSet.team2Score ? matchupSet.team2Score > matchupSet.team1Score : false).length;
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

    await Promise.all(map.scores?.map(score => score.remove()) ?? []);
    await map.remove();

    await updateMatchup(map.set.matchup!.ID);

    ctx.body = {
        success: true,
    };
});

export default matchupRouter;
