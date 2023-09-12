import { Matchup } from "../../../../Models/tournaments/matchup";
import ormConfig from "../../../../ormconfig";

export default async function assignTeamsToNextMatchup (matchupID: number) {
    await ormConfig.transaction(async (manager) => {
        const matchupWithNextMatchups = await manager
            .createQueryBuilder(Matchup, "matchup")
            .leftJoinAndSelect("matchup.nextMatchups", "nextMatchup")
            .leftJoinAndSelect("nextMatchup.team1", "team1")
            .leftJoinAndSelect("nextMatchup.team2", "team2")
            .leftJoinAndSelect("nextMatchup.potentials", "potential")
            .leftJoinAndSelect("potential.team1", "potentialTeam1")
            .leftJoinAndSelect("potential.team2", "potentialTeam2")
            .where("matchup.ID = :matchupID", { matchupID })
            .getOne();
        if (matchupWithNextMatchups?.nextMatchups?.length) {
            const winner = matchupWithNextMatchups.winner;
            const loser = !winner ? undefined : winner.ID === matchupWithNextMatchups.team1?.ID ? matchupWithNextMatchups.team2 : matchupWithNextMatchups.team1;
            const nextMatchups = matchupWithNextMatchups.nextMatchups;

            for (const nextMatchup of nextMatchups) {
                const focus = nextMatchup.isLowerBracket && !matchupWithNextMatchups.isLowerBracket ? loser : winner;
                await Promise.all(nextMatchup.potentials?.map(potential => {
                    if (potential.team1?.ID !== focus?.ID && potential.team2?.ID !== focus?.ID)
                        potential.invalid = true;
                    return manager.save(potential);
                }) ?? []);

                const dates = (nextMatchup.potentials?.map(potential => potential.date.getTime()) ?? [])
                    .filter((date, i, arr) => arr.indexOf(date) === i);
                if (dates.length === 1) {
                    nextMatchup.date = new Date(dates[0]);
                    await manager.save(nextMatchup);
                }

                if (nextMatchup.team1 ?? nextMatchup.team2) {
                    if (!nextMatchup.team1 && nextMatchup.team2?.ID !== focus?.ID)
                        nextMatchup.team1 = focus;
                    else if (!nextMatchup.team2 && nextMatchup.team1?.ID !== focus?.ID)
                        nextMatchup.team2 = focus;
                } else {
                    const validPotentials = nextMatchup.potentials?.filter(potential => !potential.invalid);
                    const potentialsWithTeam = validPotentials?.filter(potential => potential.team1?.ID === focus?.ID || potential.team2?.ID === focus?.ID);
                    if (potentialsWithTeam?.map(potential => potential.team1?.ID === focus?.ID ? 1 : 2).filter((team, i, arr) => arr.indexOf(team) === i).length === 1) {
                        if (potentialsWithTeam[0].team1?.ID === focus?.ID)
                            nextMatchup.team1 = focus;
                        else
                            nextMatchup.team2 = focus;
                    } else
                        nextMatchup.team1 = focus;
                }

                await manager.save(nextMatchup);
            }
        }
    }); 
}