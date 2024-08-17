import { TextChannel } from "discord.js";
import { Matchup } from "../../../../Models/tournaments/matchup";
import ormConfig from "../../../../ormconfig";
import { discordClient } from "../../../discord";
import { config } from "node-config-ts";
import { Team } from "../../../../Models/tournaments/team";
import { EntityManager } from "typeorm";

async function sendDiscordError (error: string) {
    const channel = discordClient.channels.cache.get(config.discord.coreChannel);
    if (channel instanceof TextChannel)
        await channel.send(error);
}

async function assignTeamToNextPotentials (manager: EntityManager, team: Team, matchup2ID: number) {
    const matchup2NextMatchups = await manager
        .createQueryBuilder(Matchup, "matchup")
        .leftJoinAndSelect("matchup.potentials", "potential")
        .leftJoinAndSelect("potential.team1", "team1")
        .leftJoinAndSelect("potential.team2", "team2")
        .leftJoin("matchup.loserPreviousMatchups", "loserPreviousMatchup")
        .leftJoin("matchup.winnerPreviousMatchups", "winnerPreviousMatchup")
        .where("loserPreviousMatchup.ID = :matchupID OR winnerPreviousMatchup.ID = :matchupID", { matchupID: matchup2ID })
        .getMany();
    for (const matchup3 of matchup2NextMatchups) {
        if (!matchup3.potentials)
            continue;

        if (matchup3.potentials.some(p => p.team1?.ID === team.ID || p.team2?.ID === team.ID))
            throw new Error(`Team ID \`${team.ID}\` is already assigned to some potentials for matchup ID \`${matchup3.ID}\``);
        
        // Only concerned with half of the potentials that don't have both teams assigned
        for (const potential of matchup3.potentials.filter(p => !p.team1 || !p.team2).slice(0, Math.ceil(matchup3.potentials.length / 2))) {
            if (!potential.team1)
                potential.team1 = team;
            else
                potential.team2 = team;
            await manager.save(potential);
        }
    }
}

async function invalidatePotentials (manager: EntityManager, team: Team, matchup2ID: number) {
    const matchup2Potentials = await manager
        .createQueryBuilder(Matchup, "matchup")
        .innerJoinAndSelect("matchup.potentialFor", "potentialFor")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .where("potentialFor.ID = :matchupID", { matchupID: matchup2ID })
        .getMany();
    for (const matchup2Potential of matchup2Potentials) {
        if (matchup2Potential.team1?.ID !== team.ID && matchup2Potential.team2?.ID !== team.ID) {
            matchup2Potential.invalid = true;
            await manager.save(matchup2Potential);
        }
    }
}

async function assignTeam (manager: EntityManager, team: Team, matchup2ID: number) {
    const matchup2 = await manager
        .createQueryBuilder(Matchup, "matchup")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("matchup.winner", "winner")
        .where("matchup.ID = :matchupID", { matchupID: matchup2ID })
        .getOne();
    if (!matchup2)
        throw new Error(`Failed to find matchup ID \`${matchup2ID}\` to assign teams to their next matchup`);
    if (matchup2.team1 && matchup2.team2)
        throw new Error(`Matchup ID \`${matchup2ID}\` already has 2 teams assigned to it`);
    if (matchup2.winner)
        throw new Error(`Matchup ID \`${matchup2ID}\` already has a winner assigned to it`);

    if (!matchup2.team1)
        matchup2.team1 = team;
    else
        matchup2.team2 = team;
    await manager.save(matchup2);
    await invalidatePotentials(manager, team, matchup2ID); // Invalidate any potentials that don't contain the team now that the team is definitely playing in this matchup
    await assignTeamToNextPotentials(manager, team, matchup2ID); // Find any matchups that this NEW matchup is a previous matchup for to assign this team to some of the potentials that may exist for them (Match 3 in example below)
}

/**
 * Example to explain the entire functionality of this:
 * IF match 1 is a previous winner matchup for match 2
 * AND match 2 is a previous loser/winner matchup for match 3
 * AND if team A won match 1
 * THEN team A should be assigned to match 2 as team 1 or 2,
 * AND team A should be assigned into some of match 3's potentials as team 1 or 2 
 * Variables are named based on this example
 * 
 * @param matchup1ID The ID of the matchup that just finished with a winner to assign to their next matchups
 */
export default async function assignTeamsToNextMatchup (matchup1ID: number) {
    await ormConfig.transaction(async (manager) => {
        const matchup1 = await manager
            .createQueryBuilder(Matchup, "matchup")
            .innerJoinAndSelect("matchup.team1", "team1")
            .innerJoinAndSelect("matchup.team2", "team2")
            .innerJoinAndSelect("matchup.winner", "winner")
            .where("matchup.ID = :matchupID", { matchupID: matchup1ID })
            .getOne(); // Match 1 in example above
        if (!matchup1) {
            await sendDiscordError(`\`assignTeamsToNextMatchup error\`\nFailed to find matchup ID \`${matchup1ID}\` to assign teams to their next matchup`);
            return;
        }
        if (!matchup1.winner) {
            await sendDiscordError(`\`assignTeamsToNextMatchup error\`\nMatchup ID \`${matchup1ID}\` has no winner to assign teams to their next matchup`);
            return;
        }
        if (!matchup1.team1 || !matchup1.team2) {
            await sendDiscordError(`\`assignTeamsToNextMatchup error\`\nMatchup ID \`${matchup1ID}\` has teams missing to assign to their next matchup`);
            return;
        }

        const matchup1NextMatchups = await manager
            .createQueryBuilder(Matchup, "matchup")
            .leftJoinAndSelect("matchup.loserPreviousMatchups", "loserPreviousMatchup")
            .leftJoinAndSelect("matchup.winnerPreviousMatchups", "winnerPreviousMatchup")
            .where("loserPreviousMatchup.ID = :matchupID OR winnerPreviousMatchup.ID = :matchupID", { matchupID: matchup1ID })
            .getMany();

        const winner = matchup1.winner.ID === matchup1.team1.ID ? matchup1.team1 : matchup1.team2;
        const loser = matchup1.winner.ID === matchup1.team1.ID ? matchup1.team2 : matchup1.team1;
        try {
            for (const matchup2 of matchup1NextMatchups) { // Match 2s in example above
                if (matchup2.loserPreviousMatchups?.some(m => m.ID === matchup1.ID))
                    await assignTeam(manager, loser, matchup2.ID);
                if (matchup2.winnerPreviousMatchups?.some(m => m.ID === matchup1.ID))
                    await assignTeam(manager, winner, matchup2.ID);
            }
        } catch (error) {
            await sendDiscordError(`\`assignTeamsToNextMatchup error\`\nFailed to assign teams to their next matchups from matchup ID \`${matchup1ID}\`\n\`\`\`${error}\`\`\``);
        }
    }); 
}