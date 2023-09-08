import Router from "@koa/router";
import { createHash } from "crypto";
import { Beatmap, Mode } from "nodesu";
import { MatchupList, MatchupScore } from "../../../../Interfaces/matchup";
import { applyMods, modsToAcronym } from "../../../../Interfaces/mods";
import { StageType } from "../../../../Interfaces/stage";
import { unallowedToPlay } from "../../../../Interfaces/tournament";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Stage } from "../../../../Models/tournaments/stage";
import { Team } from "../../../../Models/tournaments/team";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { discordClient } from "../../../discord";
import { validateStageOrRound } from "../../../middleware/tournament";
import { osuClient } from "../../../osu";

const stageRouter = new Router();

stageRouter.get("/:stageID/matchups", validateStageOrRound, async (ctx) => {
    const stage: Stage = ctx.state.stage;

    let matchups = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("matchup.teams", "teams")
        .leftJoinAndSelect("matchup.potentialFor", "potentialFor")
        .where("stage.ID = :stageID", { stageID: stage.ID })
        .andWhere("matchup.invalid = 0")
        .getMany();

    matchups.sort((a, b) => a.ID - b.ID);
    matchups = matchups.filter((matchup) => 
        matchup.potentialFor && 
        matchups.filter((m) => m.potentialFor && m.potentialFor.ID === matchup.potentialFor!.ID).length === 1 ? 
            false : 
            true
    );

    const potentialIDs = new Map<number, number>();

    ctx.body = {
        success: true,
        matchups: matchups.map<MatchupList>((matchup) => {
            const teams: Team[] = [];
            if (matchup.team1)
                teams.push(matchup.team1);
            if (matchup.team2)
                teams.push(matchup.team2);
            if (matchup.teams)
                teams.push(...matchup.teams);

            let val = 0;
            if (matchup.potentialFor) {
                const num = potentialIDs.get(matchup.potentialFor.ID);
                if (typeof num === "number")
                    val = num + 1;

                potentialIDs.set(matchup.potentialFor.ID, val);
            }

            return {
                ID: matchup.ID,
                date: matchup.date,
                mp: matchup.mp,
                vod: matchup.vod,
                potential: matchup.potentialFor ? `${matchup.potentialFor.ID}-${String.fromCharCode("A".charCodeAt(0) + val)}` : undefined,
                teams: teams.map((team) => {
                    return {
                        ID: team.ID,
                        name: team.name,
                        avatarURL: team.avatarURL,
                        pp: team.pp,
                        rank: team.rank,
                        BWS: team.BWS,
                        members: [],
                    };
                }),
            };
        }),
    };
});

stageRouter.get("/:stageID/mappools", validateStageOrRound, async (ctx) => {
    if (await ctx.cashed())
        return;

    const stage: Stage = ctx.state.stage;

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.roles", "roles")
        .innerJoinAndSelect("tournament.organizer", "organizer")
        .where("tournament.ID = :tournamentID", { tournamentID: stage.tournament.ID })
        .getOne();

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }

    const mappoolQ = await Mappool
        .createQueryBuilder("mappool")
        .innerJoinAndSelect("mappool.stage", "stage")
        .innerJoinAndSelect("mappool.slots", "slots")
        .innerJoinAndSelect("slots.maps", "maps")
        .leftJoinAndSelect("maps.beatmap", "beatmaps")
        .leftJoinAndSelect("beatmaps.beatmapset", "beatmapsets")
        .leftJoinAndSelect("maps.customBeatmap", "customBeatmaps")
        .leftJoinAndSelect("maps.customMappers", "customMappers");

    let showPrivate = false;
    if (ctx.query.key) {
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

        const keyCheck = await Tournament
            .createQueryBuilder("tournament")
            .where("tournament.key = :key", { key: hashedKey })
            .getExists();

        if (keyCheck)
            showPrivate = true;
    } else if (tournament.organizer.ID === ctx.state.user?.ID)
        showPrivate = true;
    else if (ctx.state.user?.discord.userID) {
        // Checking if they have privileged roles or not
        try {
            const privilegedRoles = tournament.roles.filter(r => unallowedToPlay.some(u => u === r.roleType));
            const tournamentServer = await discordClient.guilds.fetch(tournament.server);
            const discordMember = await tournamentServer.members.fetch(ctx.state.user.discord.userID);
            if (privilegedRoles.some(r => discordMember.roles.cache.has(r.roleID)))
                showPrivate = true;
        } catch (e) {
            showPrivate = false;
        }
    }

    if (!showPrivate)
        mappoolQ.andWhere("mappool.isPublic = 1");

    const mappools = await mappoolQ
        .andWhere("stage.ID = :stageID", { stageID: stage.ID })
        .getMany();

    const updateBeatmapData = async (mappool: Mappool, slot: MappoolSlot, map: MappoolMap) => {
        if (!mappool.isPublic) {
            mappool.mappackLink = null;
            mappool.mappackExpiry = null;
        }

        if (!slot.allowedMods || !map.beatmap)
            return;

        const set = await osuClient.beatmaps.getByBeatmapId(map.beatmap.ID, Mode.all, undefined, undefined, slot.allowedMods) as Beatmap[];
        if (set.length === 0)
            return;

        const beatmap = applyMods(set[0], modsToAcronym(slot.allowedMods));
        map.beatmap.totalLength = beatmap.totalLength;
        map.beatmap.totalSR = beatmap.difficultyRating;
        map.beatmap.circleSize = beatmap.circleSize;
        map.beatmap.overallDifficulty = beatmap.overallDifficulty;
        map.beatmap.approachRate = beatmap.approachRate;
        map.beatmap.hpDrain = beatmap.hpDrain;
        if (map.beatmap.beatmapset)
            map.beatmap.beatmapset.BPM = beatmap.bpm;
    };

    const beatmapPromises: Promise<void>[] = [];
    mappools.forEach(mappool => {
        mappool.slots.forEach(slot => {
            slot.maps.forEach(map => {
                beatmapPromises.push(updateBeatmapData(mappool, slot, map));
            });
        });
    });
    await Promise.all(beatmapPromises);

    ctx.body = {
        success: true,
        mappools,
    };
});

stageRouter.get("/:stageID/scores", validateStageOrRound, async (ctx) => {
    const stage: Stage = ctx.state.stage;

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.roles", "roles")
        .innerJoinAndSelect("tournament.organizer", "organizer")
        .where("tournament.ID = :tournamentID", { tournamentID: stage.tournament.ID })
        .getOne();

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }

    if (stage.stageType === StageType.Qualifiers) {
        // For when tournaments don't have their qualifier scores public
        if (ctx.query.key) {
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

            const keyCheck = await Tournament
                .createQueryBuilder("tournament")
                .where("tournament.key = :key", { key: hashedKey })
                .getExists();

            if (!keyCheck) {
                ctx.body = {
                    success: false,
                    error: "Tournament does not have public qualifiers and you are not logged in to view this tournament's scores",
                };
                return;
            }
        } else if (
            !stage.publicScores && 
            tournament.organizer.ID !== ctx.state.user?.ID
        ) {
            if (!ctx.state.user?.discord.userID) {
                ctx.body = {
                    success: false,
                    error: "Tournament does not have public qualifiers and you are not logged in to view this tournament's scores",
                };
                return;
            }

            // Checking if they have privileged roles or not
            try {
                const privilegedRoles = tournament.roles.filter(r => unallowedToPlay.some(u => u === r.roleType));
                const tournamentServer = await discordClient.guilds.fetch(tournament.server);
                const discordMember = await tournamentServer.members.fetch(ctx.state.user.discord.userID);
                if (!privilegedRoles.some(r => discordMember.roles.cache.has(r.roleID))) {
                    ctx.body = {
                        success: false,
                        error: "Tournament does not have public qualifiers and you do not have the required role to view scores",
                    };
                    return;
                }
            } catch (e) {
                ctx.body = {
                    success: false,
                    error: `Tournament does not have public qualifiers and you may not be in the discord server to view scores.\n${e}`,
                };
                return;
            }
        }
    }

    const teams = await Team
        .createQueryBuilder("team")
        .innerJoinAndSelect("team.members", "member")
        .innerJoinAndSelect("team.tournaments", "tournament")
        .where("tournament.ID = :tournamentID", { tournamentID: stage.tournament.ID })
        .getMany();

    const teamLookup = new Map<string, Team>();
    teams.forEach(team => {
        team.members.forEach(member => {
            teamLookup.set(member.osu.userID, team);
        });
    });

    const rawScores = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .innerJoin("matchup.sets", "set")
        .innerJoin("set.maps", "map")
        .innerJoin("map.map", "mappoolMap")
        .innerJoin("mappoolMap.slot", "slot")
        .innerJoin("matchupMap.scores", "score")
        .innerJoin("score.user", "user")
        .where("tournament.ID = :tournamentID", { tournamentID: stage.tournament.ID })
        .andWhere("stage.ID = :stageID", { stageID: stage.ID })
        .select([
            "user.osuUsername",
            "user.osuUserid",
            "score.score",
            "slot.acronym",
            "slot.ID",
            "mappoolMap.order",
        ])
        .getRawMany();
    const scores: MatchupScore[] = rawScores.map(score => {
        const team = teamLookup.get(score.osuUserid) || { ID: -1, name: "N/A", avatarURL: undefined };
        return {
            teamID: team.ID,
            teamName: team.name,
            teamAvatar: team.avatarURL,
            username: score.osuUsername,
            userID: parseInt(score.osuUserid),
            score: score.score_score,
            map: `${score.slot_acronym}${score.mappoolMap_order}`,
            mapID: parseInt(`${score.slot_ID}${score.mappoolMap_order}`),
        };
    });

    ctx.body = {
        success: true,
        scores,
    };
});

export default stageRouter;