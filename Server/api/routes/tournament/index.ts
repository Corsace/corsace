import Router from "@koa/router";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { BaseQualifier, QualifierScore } from "../../../../Interfaces/qualifier";
import { Next, ParameterizedContext } from "koa";
import { TeamList, TeamMember } from "../../../../Interfaces/team";
import { Team } from "../../../../Models/tournaments/team";
import { unallowedToPlay } from "../../../../Models/tournaments/tournamentRole";
import { discordClient } from "../../../discord";

async function validateID (ctx: ParameterizedContext, next: Next) {
    const ID = parseInt(ctx.params.tournamentID);
    if (isNaN(ID)) {
        ctx.body = {
            success: false,
            error: "Invalid tournament ID",
        };
        return;
    }

    ctx.state.ID = ID;

    await next();
}

const tournamentRouter = new Router();

tournamentRouter.get("/open/:year", async (ctx) => {
    if (await ctx.cashed())
        return;

    const year = parseInt(ctx.params.year);
    if (isNaN(year)) {
        ctx.body = {
            success: false,
            error: "Invalid year",
        };
        return;
    }

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.stages", "stages")
        .leftJoinAndSelect("stages.rounds", "rounds")
        .leftJoinAndSelect("tournament.organizer", "organizer")
        .leftJoinAndSelect("tournament.teams", "team")
        .leftJoinAndSelect("stages.mappool", "mappools")
        .leftJoinAndSelect("rounds.mappool", "roundMappools")
        .leftJoinAndSelect("mappools.slots", "slots")
        .leftJoinAndSelect("slots.maps", "maps")
        .leftJoinAndSelect("maps.beatmap", "beatmaps", "mappools.isPublic = true")
        .leftJoinAndSelect("beatmaps.beatmapset", "beatmapsets")
        .leftJoinAndSelect("beatmapsets.creator", "beatmapsetCreator")
        .leftJoinAndSelect("roundMappools.slots", "roundSlots")
        .leftJoinAndSelect("roundSlots.maps", "roundMaps")
        .leftJoinAndSelect("roundMaps.beatmap", "roundBeatmaps", "roundMappools.isPublic = true")
        .leftJoinAndSelect("roundMaps.customBeatmap", "roundCustomBeatmaps", "roundMappools.isPublic = true")
        .where("tournament.year = :year", { year })
        .andWhere("tournament.isOpen = true")
        .getOne();

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }
    tournament.stages.forEach(stage => {
        stage.rounds.forEach(round => {
            round.mappool.forEach(mappool => {
                if (!mappool.isPublic) {
                    mappool.mappackLink = null;
                    mappool.mappackExpiry = null;
                }
            });
        });
        stage.mappool?.forEach(mappool => {
            if (!mappool.isPublic) {
                mappool.mappackLink = null;
                mappool.mappackExpiry = null;
            }
        });
    });

    ctx.body = tournament;
});

tournamentRouter.get("/:tournamentID/teams", validateID, async (ctx) => {
    // TODO: Use tournament ID and only bring registered teams
    // TODO: Effectively, we also removed isRegistered from the response
    const ID: number = ctx.state.ID;

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "teams")
        .leftJoinAndSelect("tournament.mode", "mode")
        .where("tournament.ID = :ID", { ID })
        .getOne();

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }

    const teams = await Team
        .createQueryBuilder("team")
        .innerJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .getMany();

    ctx.body = await Promise.all(teams.map<Promise<TeamList>>(async t => {
        const members = t.members;
        if (!members.some(m => m.ID === t.manager.ID))
            members.push(t.manager);
        return {
            ID: t.ID,
            name: t.name,
            avatarURL: t.avatarURL,
            pp: t.pp,
            BWS: t.BWS,
            rank: t.rank,
            members: members
                .map<TeamMember>(m => ({
                    ID: m.ID,
                    username: m.osu.username,
                    osuID: m.osu.userID,
                    BWS: m.userStatistics?.find(s => s.modeDivision.ID === tournament.mode.ID)?.BWS ?? 0,
                    isManager: m.ID === t.manager.ID,
                })),
            isRegistered: tournament.teams.some(team => team.ID === t.ID),
        };
    }));
});

tournamentRouter.get("/:tournamentID/qualifiers", validateID, async (ctx) => {
    const ID: number = ctx.state.ID;

    const qualifiers = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.teams", "team")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .where("tournament.ID = :ID", { ID })
        .andWhere("stage.stageType = '0'")
        .getMany();
    
    ctx.body = qualifiers.map<BaseQualifier>(q => ({
        ID: q.ID,
        date: q.date,
        team: q.teams?.[0] ? {
            ID: q.teams[0].ID,
            name: q.teams[0].name,
            avatarURL: q.teams[0].avatarURL,
        } : undefined,
    }));
});

tournamentRouter.get("/:tournamentID/qualifiers/scores", validateID, async (ctx) => {
    const ID: number = ctx.state.ID;

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.roles", "roles")
        .innerJoinAndSelect("tournament.organizer", "organizer")
        .where("tournament.ID = :ID", { ID })
        .getOne();

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }

    const q = Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .innerJoinAndSelect("matchup.teams", "team")
        .innerJoinAndSelect("team.manager", "manager")
        .innerJoinAndSelect("team.members", "member")
        .innerJoinAndSelect("matchup.maps", "matchupMap")
        .innerJoinAndSelect("matchupMap.map", "mappoolMap")
        .innerJoinAndSelect("mappoolMap.slot", "slot")
        .innerJoinAndSelect("matchupMap.scores", "score")
        .innerJoinAndSelect("score.user", "user")
        .where("tournament.ID = :ID", { ID })
        .andWhere("stage.stageType = '0'");

    // For when tournaments don't have their qualifier scores public
    if (
        !tournament.publicQualifiers && 
        tournament.organizer.ID !== ctx.state.user?.ID
    ) {
        if (ctx.state.user?.discord.userID) {
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

    const qualifiers = await q.getMany();
    const scores: QualifierScore[] = [];
    for (const qualifier of qualifiers) {
        for (const matchupMap of qualifier.maps ?? []) {
            for (const score of matchupMap.scores ?? []) {
                const team = qualifier.teams?.find(t => t.members.some(m => m.ID === score.user?.ID));
                if (!team)
                    continue;

                scores.push({
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

    ctx.body = scores;
});

export default tournamentRouter;