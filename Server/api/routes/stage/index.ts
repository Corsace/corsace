import { CorsaceRouter } from "../../../corsaceRouter";
import { createHash } from "crypto";
import { TournamentStageState } from "koa";
import { Beatmap, Converts, Mode } from "nodesu";
import { MatchupList, MatchupScore } from "../../../../Interfaces/matchup";
import { applyMods, modsToAcronym } from "../../../../Interfaces/mods";
import { StageType } from "../../../../Interfaces/stage";
import { canViewPrivateMappools, unallowedToPlay } from "../../../../Interfaces/tournament";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { Matchup, MatchupWithRelationIDs } from "../../../../Models/tournaments/matchup";
import { Team } from "../../../../Models/tournaments/team";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { discordClient } from "../../../discord";
import { validateStageOrRound } from "../../../middleware/tournament";
import { osuClient } from "../../../osu";
import { TeamList, TeamMember } from "../../../../Interfaces/team";
import { MatchupSet } from "../../../../Models/tournaments/matchupSet";
import { User } from "../../../../Models/user";
import { cache } from "../../../cache";

const stageRouter  = new CorsaceRouter<TournamentStageState>();

stageRouter.$use("/:stageID", validateStageOrRound);

stageRouter.$get<{ matchups: MatchupList[] }>("/:stageID/matchups", async (ctx) => {
    const stage = ctx.state.stage;

    let matchups: MatchupWithRelationIDs[] = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.streamer", "streamer")
        .leftJoinAndSelect("matchup.potentialFor", "potentialFor")
        .where("stage.ID = :stageID", { stageID: stage.ID })
        .andWhere("matchup.invalid = 0")
        .loadAllRelationIds({
            relations: ["team1", "team2", "teams", "commentators"],
        })
        .getMany() as any;

    const teamIds = new Set<number>();
    for (const matchup of matchups) {
        if (matchup.team1) teamIds.add(matchup.team1);
        if (matchup.team2) teamIds.add(matchup.team2);
        for (const team of matchup.teams)
            teamIds.add(team);
    }

    const commentatorIds = new Set<number>();
    for (const matchup of matchups) {
        for (const commentator of matchup.commentators)
            commentatorIds.add(commentator);
    }

    const teams = teamIds.size === 0 ? [] : await Team
        .createQueryBuilder("team")
        .innerJoinAndSelect("team.members", "members")
        .leftJoinAndSelect("members.userStatistics", "memberStatistics")
        .innerJoinAndSelect("team.captain", "captain")
        .leftJoinAndSelect("captain.userStatistics", "captainStatistics")
        .where("team.ID IN (:...teamIds)", { teamIds: Array.from(teamIds) })
        .getMany();

    const sets: (Omit<MatchupSet, "matchup"> & { matchup: number })[] = matchups.length === 0 ? [] : await MatchupSet
        .createQueryBuilder("sets")
        .where("sets.matchupID IN (:...matchupIds)", { matchupIds: matchups.map((m) => m.ID) })
        .loadAllRelationIds({
            relations: ["matchup"],
        })
        .getMany() as any;

    const commentators = commentatorIds.size === 0 ? [] : await User
        .createQueryBuilder("user")
        .where("user.ID IN (:...commentatorIds)", { commentatorIds: Array.from(commentatorIds) })
        .getMany();

    matchups.sort((a, b) => a.date.getTime() - b.date.getTime());
    matchups = matchups.filter((matchup) =>
        matchup.potentialFor &&
        matchups.filter((m) => m.potentialFor && m.potentialFor.ID === matchup.potentialFor!.ID).length === 1 ?
            false :
            true
    );

    ctx.body = {
        success: true,
        matchups: await Promise.all(matchups.map<Promise<MatchupList>>(async (matchup) => {
            const matchupTeams: TeamList[] = [];
            const teamToTeamList = (team: Team): TeamList => {
                let members = team.members;
                if (!members.some((member) => member.ID === team.captain.ID))
                    members = [team.captain, ...members];
                return {
                    ID: team.ID,
                    name: team.name,
                    abbreviation: team.abbreviation,
                    avatarURL: team.avatarURL,
                    pp: team.pp,
                    rank: team.rank,
                    BWS: team.BWS,
                    members: members.map<TeamMember>((member) => {
                        return {
                            ID: member.ID,
                            username: member.osu.username,
                            osuID: member.osu.userID,
                            country: member.country,
                            isCaptain: member.ID === team.captain.ID,
                            rank: member.userStatistics?.[0]?.rank ?? 0,
                        };
                    }),
                };
            };
            if (matchup.team1)
                matchupTeams.push(teamToTeamList(teams.find((t) => t.ID === matchup.team1)!));
            if (matchup.team2)
                matchupTeams.push(teamToTeamList(teams.find((t) => t.ID === matchup.team2)!));
            if (matchup.teams)
                matchupTeams.push(...teams.filter((t) => matchup.teams.includes(t.ID)).map(teamToTeamList));

            const matchupSets = sets.filter((set) => set.matchup === matchup.ID);

            // Less than 2 teams means we need to put placeholder text of Winner of/Loser of match ID X
            if (matchupTeams.length < 2) {
                const prevWinnerMatchups: (Omit<Matchup, "team1" | "team2" | "teams"> & { team1: number; team2: number; teams: number[] })[] = await Matchup
                    .createQueryBuilder("matchup")
                    .leftJoin("matchup.winnerNextMatchup", "winnerNextMatchup")
                    .where("winnerNextMatchup.ID = :matchupID", { matchupID: matchup.ID })
                    .loadAllRelationIds({
                        relations: ["team1", "team2", "teams"],
                    })
                    .getMany() as any;

                // If theres a matchup with teams not in matchupTeams, we add a team with the name "winner of X" to the list
                const unFinishedWinnerMatchups = prevWinnerMatchups.filter((m) => !matchupTeams.some((t) => t.ID === m.team1 && t.ID === m.team2 && m.teams.some((team) => team === t.ID)));
                if (unFinishedWinnerMatchups.length > 0) {
                    matchupTeams.push(...unFinishedWinnerMatchups.map((unFinishedWinnerMatchup) => ({
                        ID: -1,
                        name: `Winner of ${unFinishedWinnerMatchup.matchID}`,
                        abbreviation: "",
                        avatarURL: "",
                        members: [],
                        pp: 0,
                        rank: 0,
                        BWS: 0,
                    })));
                }
                const prevLoserMatchups: (Omit<Matchup, "team1" | "team2" | "teams"> & { team1: number; team2: number; teams: number[] })[] = await Matchup
                    .createQueryBuilder("matchup")
                    .leftJoin("matchup.loserNextMatchup", "loserNextMatchup")
                    .where("loserNextMatchup.ID = :matchupID", { matchupID: matchup.ID })
                    .loadAllRelationIds({
                        relations: ["team1", "team2", "teams"],
                    })
                    .getMany() as any;
                const unFinishedLoserMatchups = prevLoserMatchups.filter((m) => !matchupTeams.some((t) => t.ID === m.team1 && t.ID === m.team2 && m.teams.some((team) => team === t.ID)));
                if (unFinishedLoserMatchups.length > 0) {
                    matchupTeams.push(...unFinishedLoserMatchups.map((unFinishedLoserMatchup) => ({
                        ID: -1,
                        name: `Loser of ${unFinishedLoserMatchup.matchID}`,
                        abbreviation: "",
                        avatarURL: "",
                        members: [],
                        pp: 0,
                        rank: 0,
                        BWS: 0,
                    })));
                }
            }

            return {
                ID: matchup.ID,
                matchID: matchup.matchID,
                date: matchup.date,
                mp: matchup.mp,
                vod: matchup.vod,
                forfeit: matchup.forfeit,
                potentialFor: matchup.potentialFor?.matchID,
                team1Score: matchupSets.length === 1 ? matchupSets[0].team1Score : matchup.team1Score,
                team2Score: matchupSets.length === 1 ? matchupSets[0].team2Score : matchup.team2Score,
                teams: matchupTeams,
                referee: matchup.referee ? {
                    ID: matchup.referee.ID,
                    username: matchup.referee.osu.username,
                } : undefined,
                commentators: commentators.filter((c) => matchup.commentators?.includes(c.ID)).map((commentator) => ({
                    ID: commentator.ID,
                    username: commentator.osu.username,
                })),
                streamer: matchup.streamer ? {
                    ID: matchup.streamer.ID,
                    username: matchup.streamer.osu.username,
                } : undefined,
            };
        })),
    };
});

stageRouter.$get<{ mappools: Mappool[] }>("/:stageID/mappools", async (ctx) => {
    const stage = ctx.state.stage;

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

    const mappoolQ = Mappool
        .createQueryBuilder("mappool")
        .innerJoinAndSelect("mappool.stage", "stage")
        .innerJoinAndSelect("mappool.slots", "slots")
        .innerJoinAndSelect("slots.maps", "maps")
        .leftJoinAndSelect("maps.beatmap", "beatmaps")
        .leftJoinAndSelect("beatmaps.beatmapset", "beatmapsets")
        .leftJoinAndSelect("beatmapsets.creator", "beatmapCreators")
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
            const privilegedRoles = tournament.roles.filter(r => canViewPrivateMappools.some(u => u === r.roleType));
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

        const cacheKey = `mappool-beatmap;${map.beatmap.ID};${Mode.all};${Converts.exclude};${slot.allowedMods}`;
        const cachedBeatmap = cache.get(cacheKey) as string | undefined;
        if (cachedBeatmap) {
            map.beatmap = JSON.parse(cachedBeatmap);
            return;
        }

        const set = await osuClient.beatmaps.getByBeatmapId(map.beatmap.ID, Mode.all, undefined, Converts.exclude, slot.allowedMods) as Beatmap[];
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

        cache.set(cacheKey, JSON.stringify(map.beatmap));
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

stageRouter.$get<{ scores: MatchupScore[] }>("/:stageID/scores", async (ctx) => {
    const stage = ctx.state.stage;

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
        .innerJoin("map.scores", "score")
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
        const team = teamLookup.get(score.osuUserid) ?? { ID: -1, name: "N/A", avatarURL: undefined };
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
