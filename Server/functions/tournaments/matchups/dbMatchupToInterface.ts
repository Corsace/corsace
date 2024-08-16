import { Matchup } from "../../../../Models/tournaments/matchup";
import { Matchup as MatchupInterface } from "../../../../Interfaces/matchup";
import { Round } from "../../../../Models/tournaments/round";
import { Stage } from "../../../../Models/tournaments/stage";
import dbMappoolToInterface from "../mappool/dbMappoolToInterface";

export default async function dbMatchupToInterface (dbMatchup: Matchup, roundOrStage: Round | Stage | null): Promise<MatchupInterface> {
    const team1 = dbMatchup.team1 ? await dbMatchup.team1.teamInterface() : undefined;
    const team2 = dbMatchup.team2 ? await dbMatchup.team2.teamInterface() : undefined;
    const winner = dbMatchup.winner?.ID === team1?.ID ? team1 : dbMatchup.winner?.ID === team2?.ID ? team2 : undefined;

    return {
        ID: dbMatchup.ID,
        matchID: dbMatchup.matchID,
        date: dbMatchup.date,
        mp: dbMatchup.mp,
        teams: await Promise.all(dbMatchup.teams?.map(team => team.teamInterface()) ?? []),
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
            mappool: roundOrStage.mappool?.map(mappool => dbMappoolToInterface(mappool)) ?? [],
            isDraft: roundOrStage.isDraft,
            mapOrder: roundOrStage.mapOrder,
        } : undefined,
        stage: roundOrStage instanceof Stage ? {
            ID: roundOrStage.ID,
            name: roundOrStage.name,
            abbreviation: roundOrStage.abbreviation,
            stageType: roundOrStage.stageType,
            rounds: [],
            mappool: roundOrStage.mappool?.map(mappool => dbMappoolToInterface(mappool)) ?? [],
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
        sets: await Promise.all(dbMatchup.sets?.map((set) => ({
            ID: set.ID,
            order: set.order,
            first: set.first?.ID === team1?.ID ? team1 : set.first?.ID === team2?.ID ? team2 : undefined,
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
        commentators: dbMatchup.commentators,
        messages: dbMatchup.messages,
    };
}
