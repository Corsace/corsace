import { MatchupWithRelationIDs } from "../../../../Models/tournaments/matchup";
import { Matchup as MatchupInterface } from "../../../../Interfaces/matchup";
import { Round } from "../../../../Models/tournaments/round";
import { Stage } from "../../../../Models/tournaments/stage";
import dbMappoolToInterface from "../mappool/dbMappoolToInterface";
import { Team } from "../../../../Models/tournaments/team";
import { User } from "../../../../Models/user";
import { MatchupSet } from "../../../../Models/tournaments/matchupSet";
import { MatchupMap } from "../../../../Models/tournaments/matchupMap";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";

export default async function dbMatchupToInterface (dbMatchup: MatchupWithRelationIDs, getMatchupMapBeatmaps = false, getMatchupMapScores = false): Promise<MatchupInterface> {
    const teamIds = new Set<number>();
    if (dbMatchup.team1) teamIds.add(dbMatchup.team1);
    if (dbMatchup.team2) teamIds.add(dbMatchup.team2);
    for (const team of dbMatchup.teams)
        teamIds.add(team);
    const teams = teamIds.size === 0 ? [] : await Team
        .createQueryBuilder("team")
        .innerJoinAndSelect("team.members", "members")
        .innerJoinAndSelect("team.captain", "captain")
        .where("team.ID IN (:...teamIds)", { teamIds: Array.from(teamIds) })
        .getMany();

    const commentatorIds = new Set<number>();
    for (const commentator of dbMatchup.commentators)
        commentatorIds.add(commentator);
    const commentators = commentatorIds.size === 0 ? [] : await User
        .createQueryBuilder("user")
        .where("user.ID IN (:...commentatorIds)", { commentatorIds: Array.from(commentatorIds) })
        .getMany();

    const sets: (Omit<MatchupSet, "first"> & { first: number | null })[] = dbMatchup.sets.length === 0 ? [] : await MatchupSet
        .createQueryBuilder("sets")
        .where("sets.matchupID = :ID", { ID: dbMatchup.ID })
        .loadAllRelationIds({
            relations: ["first"],
        })
        .getMany() as any;

    for (const set of sets) {
        const matchupMapQ = MatchupMap
            .createQueryBuilder("matchupMap")
            .leftJoinAndSelect("matchupMap.map", "map")
            .leftJoinAndSelect("map.slot", "slot");
        if (getMatchupMapBeatmaps) {
            matchupMapQ
                .leftJoinAndSelect("map.beatmap", "beatmap")
                .leftJoinAndSelect("beatmap.beatmapset", "beatmapset");
        }
        if (getMatchupMapScores) {
            matchupMapQ
                .leftJoinAndSelect("matchupMap.scores", "scores")
                .leftJoinAndSelect("scores.user", "user");
        }
        const matchupMaps = await matchupMapQ
            .where("matchupMap.setID = :ID", { ID: set.ID })
            .getMany();
        set.maps = matchupMaps;
    }

    const roundOrStage: Round | Stage | null = 
        dbMatchup.round ? 
            await Round
                .createQueryBuilder("round")
                .innerJoin("round.matchups", "matchup")
                .leftJoinAndSelect("round.mapOrder", "mapOrder")
                .where("matchup.ID = :ID", { ID: dbMatchup.ID })
                .getOne() :
            dbMatchup.stage ?
                await Stage
                    .createQueryBuilder("stage")
                    .innerJoin("stage.matchups", "matchup")
                    .leftJoinAndSelect("stage.mapOrder", "mapOrder")
                    .where("matchup.ID = :ID", { ID: dbMatchup.ID })
                    .getOne() : 
                null;
    
    const mappools = await Mappool
        .createQueryBuilder("mappool")
        .innerJoinAndSelect("mappool.slots", "slots")
        .innerJoinAndSelect("slots.maps", "maps")
        .leftJoinAndSelect("maps.beatmap", "map")
        .leftJoinAndSelect("map.beatmapset", "beatmapset")
        .where(`mappool.${roundOrStage instanceof Round ? "round" : "stage"}ID = :ID`, { ID: roundOrStage?.ID })
        .getMany();
    
    const team1 = dbMatchup.team1 && teams.find(t => t.ID === dbMatchup.team1) ? await teams.find(t => t.ID === dbMatchup.team1)!.teamInterface(false, false, true) : undefined;
    const team2 = dbMatchup.team2 && teams.find(t => t.ID === dbMatchup.team2) ? await teams.find(t => t.ID === dbMatchup.team2)!.teamInterface(false, false, true) : undefined;
    const winner = dbMatchup.winner && teams.find(t => t.ID === dbMatchup.winner) ? await teams.find(t => t.ID === dbMatchup.winner)!.teamInterface(false, false, true) : undefined;

    return {
        ID: dbMatchup.ID,
        matchID: dbMatchup.matchID,
        date: dbMatchup.date,
        mp: dbMatchup.mp,
        teams: await Promise.all(teams.filter(t => t.ID !== dbMatchup.team1 && t.ID !== dbMatchup.team2).map(team => team.teamInterface()) ?? []),
        team1,
        team2,
        team1Score: dbMatchup.team1Score,
        team2Score: dbMatchup.team2Score,
        potential: dbMatchup.potentialFor ? true : false,
        baseURL: dbMatchup.baseURL,
        round: roundOrStage instanceof Round ? {
            ID: roundOrStage.ID,
            name: roundOrStage.name,
            abbreviation: roundOrStage.abbreviation,
            mappool: mappools.map(mappool => dbMappoolToInterface(mappool)) ?? [],
            isDraft: roundOrStage.isDraft,
            mapOrder: roundOrStage.mapOrder,
        } : undefined,
        stage: roundOrStage instanceof Stage ? {
            ID: roundOrStage.ID,
            name: roundOrStage.name,
            abbreviation: roundOrStage.abbreviation,
            stageType: roundOrStage.stageType,
            rounds: [],
            mappool: mappools.map(mappool => dbMappoolToInterface(mappool)) ?? [],
            createdAt: roundOrStage.createdAt,
            order: roundOrStage.order,
            scoringMethod: roundOrStage.scoringMethod,
            isDraft: roundOrStage.isDraft,
            qualifierTeamChooseOrder: roundOrStage.qualifierTeamChooseOrder,
            timespan: roundOrStage.timespan,
            isFinished: roundOrStage.isFinished,
            initialSize: roundOrStage.initialSize,
            finalSize: roundOrStage.finalSize,
            publicScores: roundOrStage.publicScores,
            mapOrder: roundOrStage.mapOrder,
        } : undefined,
        isLowerBracket: dbMatchup.isLowerBracket,
        winner,
        sets: await Promise.all(sets.map((set) => ({
            ID: set.ID,
            order: set.order,
            first: set.first === team1?.ID ? team1 : set.first === team2?.ID ? team2 : undefined,
            team1Score: set.team1Score,
            team2Score: set.team2Score,
            maps: set.maps?.map(map => ({
                ID: map.ID,
                map: map.map,
                order: map.order,
                status: map.status,
                scores: map.scores?.map(score => {
                    const team = team1?.captain.ID === score.user.ID || team1?.members.find(member => member.ID === score.user.ID)
                        ? team1
                        : team2?.captain.ID === score.user.ID || team2?.members.find(member => member.ID === score.user.ID)
                            ? team2
                            : undefined;

                    return {
                        teamID: team?.ID ?? 0,
                        teamName: team?.name ?? "",
                        teamAvatar: team?.avatarURL ?? "",
                        username: score.user.osu.username,
                        userID: parseInt(score.user.osu.userID),
                        score: score.score,
                        map: `${map.map.slot.acronym}${map.order}`,
                        mapID: map.ID,
                    };
                }) ?? [],
            })) ?? [],
        })) ?? []),
        forfeit: dbMatchup.forfeit,
        referee: dbMatchup.referee,
        streamer: dbMatchup.streamer,
        commentators,
        messages: dbMatchup.messages,
    };
}
