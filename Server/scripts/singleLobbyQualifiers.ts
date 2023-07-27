import { Matchup } from "../../Models/tournaments/matchup";
import ormConfig from "../../ormconfig";

async function script () {
    const conn = await ormConfig.initialize();
    console.log("DB schema is initialized.");

    conn.transaction(async (manager) => {

        const qualifierMatchups = await manager
            .createQueryBuilder(Matchup, "matchup")
            .leftJoinAndSelect("matchup.stage", "stage")
            .leftJoinAndSelect("stage.tournament", "tournament")
            .leftJoinAndSelect("matchup.teams", "teams")
            .where("stage.stageType = '0'")
            .getMany();

        console.log(qualifierMatchups);

        // If there are multiple teams in a lobby, and the lobby hasn't been played yet, then we need to create a new matchup for each team.
        // This is because qualifier lobbies will be run for 1 team only from now on.
        for (const matchup of qualifierMatchups) {
            if (!matchup.teams || matchup.teams.length === 0) {
                console.log(`Matchup ${matchup.ID} has no teams. Removing.`);
                await manager.remove(Matchup, matchup);
                continue;
            }

            if (matchup.teams.length > 1 && !matchup.mp) {
                const newMatchups: Matchup[] = [];
                for (const team of matchup.teams) {
                    const newMatchup = new Matchup();
                    newMatchup.stage = matchup.stage;
                    newMatchup.teams = [ team ];
                    newMatchup.date = matchup.date;
                    newMatchups.push(newMatchup);
                }
                await manager.remove(Matchup, matchup);
                await matchup.remove();
                await manager.save(Matchup, newMatchups);
                await Matchup.save(newMatchups);
                console.log(`Matchup ${matchup.ID} has ${matchup.teams.length} and is not played yet. Splitting into ${matchup.teams.length} new matchups.`);
            }
        }
    });

    await conn.destroy();
}

if (module === require.main) {
    script()
        .then(() => {
            console.log("Script completed successfully!");
            process.exit(0);
        })
        .catch((err: Error) => {
            console.error("Script encountered an error!");
            console.error(err.stack);
            process.exit(1);
        });
}