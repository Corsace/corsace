import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../..";
import { StageType } from "../../../../Interfaces/stage";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { MapStatus } from "../../../../Models/tournaments/matchupMap";
import { Team } from "../../../../Models/tournaments/team";
import { unallowedToPlay } from "../../../../Models/tournaments/tournamentRole";
import channelID from "../../../functions/channelID";
import respond from "../../../functions/respond";
import getStage from "../../../functions/tournamentFunctions/getStage";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const tournament = await getTournament(m, channelID(m), "channel", undefined, true);
    if (!tournament)
        return;

    const stage = await getStage(m, tournament);
    if (!stage)
        return;

    if (stage.stageType === StageType.Qualifiers && !tournament.publicQualifiers && !await securityChecks(m, false, false, [], unallowedToPlay))
        return;

    const matchups = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .leftJoinAndSelect("matchup.maps", "map")
        .leftJoinAndSelect("map.map", "mappoolMap")
        .leftJoinAndSelect("mappoolMap.slot", "slot")
        .leftJoinAndSelect("map.scores", "score")
        .leftJoinAndSelect("score.user", "user")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("matchup.teams", "team")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("team1.members", "team1Member")
        .leftJoinAndSelect("team2.members", "team2Member")
        .where("stage.ID = :ID", { ID: stage.ID })
        .getMany();

    const maps = matchups.flatMap((matchup) => matchup.maps?.filter(map => map.status === MapStatus.Picked) ?? []);
    const mapNames = maps
        .map(map => `${map.map!.slot!.acronym}${map.map!.order}`)
        .filter((map, index, self) => self.indexOf(map) === index);
    const teams: Team[] = matchups
        .flatMap((matchup) => matchup.teams ?? [matchup.team1, matchup.team2])
        .filter((team, index, self) => team && self.findIndex(t => t && t.ID === team.ID) === index) as Team[];
    const scores = matchups
        .flatMap((matchup) => matchup.maps?.flatMap(map => map.scores ?? []) ?? [])
        .map(score => {
            // Identify the user, team, and mp like you're currently doing
            const user = score.user?.osu.username;
            const team = teams.find(team => team.members.some(member => member.ID === score.user?.ID))?.name || "N/A";
            const mp = matchups.find(matchup => matchup.maps?.some(map => map.scores?.some(s => s.ID === score.ID)) ?? false)?.mp || "N/A";

            // Obtain map name
            const map = maps.find(map => map.scores?.some(s => s.ID === score.ID));
            const mapName = mapNames.find(mapName => mapName === `${map?.map?.slot?.acronym}${map?.map?.order}`) || "N/A";

            // Return the combined data
            return `${user},${team},${mp},${mapName},${score.score}`;
        });

    const csv = `user,team,mp,mapName,score\n${scores.join("\n")}`;

    await respond(m, "Here's the scores for this stage/matchup.", undefined, undefined, [{
        name: `${tournament.name} - ${stage.name} - Scores.csv`,
        attachment: Buffer.from(csv),
    }]);
}

const data = new SlashCommandBuilder()
    .setName("matchup_scores")
    .setDescription("Get the scores, and mp ids for a given stage/matchup.");

const matchupScores: Command = {
    data,
    alternativeNames: ["scores", "scores_matchup", "mscores", "ms"],
    category: "tournaments",
    subCategory: "matchups",
    run,
};
    
export default matchupScores;