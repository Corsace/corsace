import { CorsaceRouter } from "../../corsaceRouter";
import { Qualifier, QualifierTeam } from "../../../Interfaces/qualifier";
import { unallowedToPlay } from "../../../Interfaces/tournament";
import { Matchup } from "../../../Models/tournaments/matchup";
import { discordClient } from "../../discord";

const qualifierRouter  = new CorsaceRouter();

qualifierRouter.$get("/:qualifierID", async (ctx) => {
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
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("matchup.sets", "set")
        .leftJoinAndSelect("set.maps", "map")
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
        teams: qualifier.teams?.map<QualifierTeam>(t => ({
            ID: t.ID,
            name: t.name,
            avatarURL: t.avatarURL,
        })) ?? [],
        scores: [],
    };

    const tournament = qualifier.stage!.tournament;
    let getScores = false;
    // Redundant ifs solely to make it (slightly) easier to read
    if (qualifier.stage!.publicScores)
        getScores = true;
    else if (ctx.state.user && (
        tournament.organizer.ID === ctx.state.user.ID || 
        qualifier.referee?.ID === ctx.state.user.ID ||
        qualifier.teams?.some(team => team.members.some(member => member.ID === ctx.state.user!.ID) || team.manager.ID === ctx.state.user!.ID)
    ))
        getScores = true;
    else {
        try {
            if (ctx.state.user?.discord.userID) {
                const privilegedRoles = tournament.roles.filter(r => unallowedToPlay.some(u => u === r.roleType));
                const tournamentServer = await discordClient.guilds.fetch(tournament.server);
                const discordMember = await tournamentServer.members.fetch(ctx.state.user.discord.userID);

                if (privilegedRoles.some(r => discordMember.roles.cache.has(r.roleID)))
                    getScores = true;
            }
        } catch (e) {
            getScores = false;
        }
    }

    if (getScores) {
        qualifierData.mp = qualifier.mp;
        for (const matchupMap of qualifier.sets?.[0]?.maps ?? []) {
            for (const score of matchupMap.scores ?? []) {
                const team = qualifier.teams?.find(t => t.members.some(m => m.ID === score.user?.ID));
                if (!team)
                    continue;

                qualifierData.scores.push({
                    teamID: team.ID,
                    teamName: team.name,
                    teamAvatar: team.avatarURL,
                    username: score.user.osu.username,
                    userID: parseInt(score.user.osu.userID),
                    score: score.score,
                    map: `${matchupMap.map.slot.acronym}${matchupMap.map.order}`,
                    mapID: parseInt(`${matchupMap.map.slot.ID}${matchupMap.map.order}`),
                });
            }
        }
    }

    ctx.body = {
        success: true,
        qualifierData,
    };
});

export default qualifierRouter;