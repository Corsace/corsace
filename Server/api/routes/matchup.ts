import Router from "@koa/router";
import { Multi } from "nodesu";
import { Matchup } from "../../../Models/tournaments/matchup";
import { MatchupMap } from "../../../Models/tournaments/matchupMap";
import { MatchupScore } from "../../../Models/tournaments/matchupScore";
import { TournamentRoleType } from "../../../Models/tournaments/tournamentRole";
import { isLoggedInDiscord } from "../../middleware";
import { validateTournament, hasRoles, validateStageOrRound } from "../../middleware/tournament";
import { osuClient } from "../../osu";
import { parseDateOrTimestamp } from "../../utils/dateParse";

const matchupRouter = new Router();

interface postMatchup {
    ID: number;
    isLowerBracket?: boolean;
    date?: string;
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

    const createMatchups = async (matchups: postMatchup[], parent?: Matchup): Promise<Matchup[]> => {
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

            await dbMatchup.save();
            idToMatchup.set(matchup.ID, dbMatchup);
            const previousMatchups = matchup.previousMatchups ? await createMatchups(matchup.previousMatchups, dbMatchup) : undefined;
            if (previousMatchups)
                dbMatchup.previousMatchups = previousMatchups;

            await dbMatchup.save();
            idToMatchup.set(matchup.ID, dbMatchup);
            createdMatchups.push(dbMatchup);
        }
        return createdMatchups;
    };

    try {
        const createdMatchups = await createMatchups(matchups);
        ctx.body = {
            success: true,
            matchups: createdMatchups,
        };
    } catch (err) {
        console.log(err);
        ctx.body = {
            success: false,
            error: err,
        };
    }
});

matchupRouter.post("/qualifier/mp", async (ctx) => {
    const mpID = ctx.request.body?.mpID;
    if (!mpID || isNaN(parseInt(mpID))) {
        ctx.body = {
            error: "No mpID provided",
        };
        return;
    }
    const matchID = ctx.request.body?.matchID;
    if (!matchID || isNaN(parseInt(matchID))) {
        ctx.body = {
            error: "No matchID provided",
        };
        return;
    }

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

    const mpData = await osuClient.multi.getMatch(mpID) as Multi;
    const maps: MatchupMap[] = [];
    mpData.games.forEach(game => {
        const beatmap = matchup.stage!.mappool![0].slots.find(slot => slot.maps.some(map => map.beatmap!.ID === game.beatmapId))!.maps.find(map => map.beatmap!.ID === game.beatmapId);
        if (!beatmap)
            return;

        const map = new MatchupMap(matchup, beatmap);
        game.scores.forEach(score => {
            const user = matchup.teams!.flatMap(team => team.members).find(member => member.osu.userID === score.userId.toString());
            if (!user)
                return;

            const matchupScore = new MatchupScore(user);
            matchupScore.score = score.score;
            matchupScore.mods = score.enabledMods || 0;
            matchupScore.misses = score.countMiss;
            matchupScore.combo = score.maxCombo;
            matchupScore.fail = !score.pass;
            matchupScore.accuracy = (score.count50 + 2 * score.count100 + 6 * score.count300) / Math.max(6 * (score.count50 + score.count100 + score.count300), 1);
            matchupScore.fullCombo = score.perfect || score.maxCombo === beatmap.beatmap!.maxCombo;
        });
        maps.push(map);
    });

    matchup.maps?.forEach(async map => {
        await Promise.all(map.scores.map(score => score.remove()));
        await map.remove();
    });

    maps.forEach(async map => {
        await map.save();

        map.scores?.forEach(async score => {
            await score.save();
        });
    });

    matchup.maps = maps;
    matchup.mp = mpID;
    await matchup.save();

    ctx.body = {
        success: true,
    };
});

export default matchupRouter;