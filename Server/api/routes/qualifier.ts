import Router from "@koa/router";
import { Multi } from "nodesu";
import { Qualifier } from "../../../Interfaces/qualifier";
import { Matchup } from "../../../Models/tournaments/matchup";
import { MatchupMap } from "../../../Models/tournaments/matchupMap";
import { MatchupScore } from "../../../Models/tournaments/matchupScore";
import { unallowedToPlay } from "../../../Models/tournaments/tournamentRole";
import { discordClient } from "../../discord";
import { isCorsace, isLoggedInDiscord } from "../../middleware";
import { osuClient } from "../../osu";

const qualifierRouter = new Router();

qualifierRouter.get("/:qualifierID", async (ctx) => {
    const qualifierID = parseInt(ctx.params.qualifierID);
    if (isNaN(qualifierID)) {
        ctx.body = {
            success: false,
            error: "Invalid qualifier ID",
        };
        return;
    }

    const qualifier = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .innerJoinAndSelect("tournament.organizer", "organizer")
        .leftJoinAndSelect("tournament.roles", "roles")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.teams", "team")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("matchup.maps", "map")
        .leftJoinAndSelect("map.map", "mappoolMap")
        .leftJoinAndSelect("mappoolMap.slot", "slot")
        .leftJoinAndSelect("map.scores", "score")
        .leftJoinAndSelect("score.user", "user")
        .where("matchup.ID = :qualifierID", { qualifierID })
        .andWhere("stage.stageType = '0'")
        .getOne();

    if (!qualifier) {
        ctx.body = {
            success: false,
            error: "Qualifier not found",
        };
        return;
    }

    const qualifierData: Qualifier = {
        ID: qualifier.ID,
        date: qualifier.date,
        referee: qualifier.referee ? {
            ID: qualifier.referee.ID,
            username: qualifier.referee.osu.username,
        } : undefined,
        team: qualifier.teams?.[0] ? {
            ID: qualifier.teams[0].ID,
            name: qualifier.teams[0].name,
            avatarURL: qualifier.teams[0].avatarURL,
        } : undefined,
        scores: [],
    };

    const tournament = qualifier.stage!.tournament;
    let getScores = false;
    // Redundant ifs solely to make it (slightly) easier to read
    if (tournament.publicQualifiers)
        getScores = true;
    else if (ctx.state.user && (
        tournament.organizer.ID === ctx.state.user.ID || 
        qualifier.referee?.ID === ctx.state.user.ID ||
        qualifier.teams?.some(team => team.members.some(member => member.ID === ctx.state.user.ID) || team.manager.ID === ctx.state.user.ID)
    ))
        getScores = true;
    else {
        try {
            if (ctx.state.user?.discord.userID) {
                const privilegedRoles = tournament.roles.filter(r => unallowedToPlay.some(u => u === r.roleType));
                const tournamentServer = await discordClient.guilds.fetch(tournament.server);
                await tournamentServer.members.fetch();

                const discordMember = tournamentServer.members.resolve(ctx.state.user.discord.userID);
                if (discordMember && privilegedRoles.some(r => discordMember.roles.cache.has(r.roleID)))
                    getScores = true;
            }
        } catch (e) {
            getScores = false;
        }
    }

    if (getScores) {
        for (const matchupMap of qualifier.maps ?? []) {
            for (const score of matchupMap.scores ?? []) {
                const team = qualifier.teams?.find(t => t.members.some(m => m.ID === score.user?.ID));
                if (!team)
                    continue;

                qualifierData.scores.push({
                    teamID: team.ID,
                    teamName: team.name,
                    username: score.user!.osu.username,
                    userID: score.user!.ID,
                    score: score.score,
                    map: `${matchupMap.map!.slot!.acronym}${matchupMap.map!.order}`,
                    mapID: parseInt(`${matchupMap.map!.slot.ID}${matchupMap.map!.order}`),
                });
            }
        }
    }

    ctx.body = qualifierData;
});

qualifierRouter.post("/mp", isLoggedInDiscord, isCorsace, async (ctx) => {
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
    mpData.games.forEach((game, i) => {
        const beatmap = matchup.stage!.mappool![0].slots.find(slot => slot.maps.some(map => map.beatmap!.ID === game.beatmapId))!.maps.find(map => map.beatmap!.ID === game.beatmapId);
        if (!beatmap)
            return;

        const map = new MatchupMap(matchup, beatmap);
        map.order = i + 1;
        map.scores = [];
        game.scores.forEach(score => {
            const user = matchup.teams!.flatMap(team => team.members).find(member => member.osu.userID === score.userId.toString());
            if (!user)
                return;

            const matchupScore = new MatchupScore(user);
            matchupScore.score = score.score;
            matchupScore.mods = ((score.enabledMods || game.mods) | 1) ^ 1; // Remove NF from mods (the OR 1 is to ensure NM is 0 after XOR)
            matchupScore.misses = score.countMiss;
            matchupScore.combo = score.maxCombo;
            matchupScore.fail = !score.pass;
            matchupScore.accuracy = (score.count50 + 2 * score.count100 + 6 * score.count300) / Math.max(6 * (score.count50 + score.count100 + score.count300), 1);
            matchupScore.fullCombo = score.perfect || score.maxCombo === beatmap.beatmap!.maxCombo;

            map.scores.push(matchupScore);
        });
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
    matchup.mp = mpID;
    await matchup.save();

    ctx.body = {
        success: true,
    };
});

export default qualifierRouter;