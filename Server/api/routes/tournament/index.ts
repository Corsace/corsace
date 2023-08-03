import Router from "@koa/router";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { BaseQualifier, QualifierScore } from "../../../../Interfaces/qualifier";
import { Next, ParameterizedContext } from "koa";
import { TeamList, TeamMember } from "../../../../Interfaces/team";
import { StaffMember } from "../../../../Interfaces/staff";
import { Team } from "../../../../Models/tournaments/team";
import { playingRoles, TournamentRoleType, tournamentStaffRoleOrder, unallowedToPlay } from "../../../../Interfaces/tournament";
import { discordClient } from "../../../discord";
import { osuClient } from "../../../osu";
import { Beatmap, Mode } from "nodesu";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { applyMods, modsToAcronym } from "../../../../Interfaces/mods";
import { User } from "../../../../Models/user";

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
        map.beatmap.beatmapset.BPM = beatmap.bpm;
    };
    
    const beatmapPromises: Promise<void>[] = [];
    tournament.stages.forEach(stage => {
        stage.rounds.forEach(round => {
            round.mappool.forEach(mappool => {
                mappool.slots.forEach(slot => {
                    slot.maps.forEach(map => {
                        beatmapPromises.push(updateBeatmapData(mappool, slot, map));
                    });
                });
            });
        });
        stage.mappool?.forEach(mappool => {
            mappool.slots.forEach(slot => {
                slot.maps.forEach(map => {
                    beatmapPromises.push(updateBeatmapData(mappool, slot, map));
                });
            });
        });
    });

    await Promise.all(beatmapPromises);
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

tournamentRouter.get("/:tournamentID/teams/screening", validateID, async (ctx) => {
    const ID: number = ctx.state.ID;

    const teams = await Team
        .createQueryBuilder("team")
        .innerJoin("team.tournament", "tournament")
        .innerJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .where("tournament.ID = :ID", { ID })
        .getMany();

    if (teams.length === 0) {
        ctx.body = {
            success: false,
            error: "Tournament not found or has no teams",
        };
        return;
    }

    const csv = teams.map(t => {
        const members = t.members;
        if (!members.some(m => m.ID === t.manager.ID))
            members.push(t.manager);
        return members.map(m => `${m.osu.username},${t.name},${m.osu.userID}`).join("\n");
    }).join("\n");

    ctx.set("Content-Type", "text/csv");
    ctx.body = csv;
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
    
    ctx.body = qualifiers.flatMap<BaseQualifier>(q => {
        const qualData = {
            ID: q.ID,
            date: q.date,
        };
        if (!q.teams)
            return [qualData];

        return q.teams.map<BaseQualifier>(t => ({
            ...qualData,
            team: {
                ID: t.ID,
                name: t.name,
                avatarURL: t.avatarURL,
            },
        }));
    });
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

    // For when tournaments don't have their qualifier scores public
    if (
        !tournament.publicQualifiers && 
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

    const teams = await Team
        .createQueryBuilder("team")
        .innerJoinAndSelect("team.members", "member")
        .innerJoinAndSelect("team.tournament", "tournament")
        .where("tournament.ID = :ID", { ID })
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
        .innerJoin("matchup.maps", "matchupMap")
        .innerJoin("matchupMap.map", "mappoolMap")
        .innerJoin("mappoolMap.slot", "slot")
        .innerJoin("matchupMap.scores", "score")
        .innerJoin("score.user", "user")
        .where("tournament.ID = :ID", { ID })
        .andWhere("stage.stageType = '0'")
        .select([
            "user.osuUsername",
            "user.osuUserid",
            "score.score",
            "slot.acronym",
            "slot.ID",
            "mappoolMap.order",
        ])
        .getRawMany();
    const scores: QualifierScore[] = rawScores.map(score => {
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

    ctx.body = scores;
});

tournamentRouter.get("/:tournamentID/staff", validateID, async (ctx) => {
    if (await ctx.cashed())
        return;

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

    const roles = tournament.roles.filter(r => !playingRoles.some(p => p === r.roleType));
    roles
        .sort((a, b) => parseInt(a.roleID) - parseInt(b.roleID))
        .sort((a, b) => tournamentStaffRoleOrder.indexOf(a.roleType) - tournamentStaffRoleOrder.indexOf(b.roleType));

    try {
        const server = await discordClient.guilds.fetch(tournament.server);
        await server.members.fetch();

        const staff: {
            role: string;
            roleType: TournamentRoleType;
            users: StaffMember[];
        }[] = [{
            role: "Organizer",
            roleType: TournamentRoleType.Organizer,
            users: [{
                ID: tournament.organizer.ID,
                username: tournament.organizer.osu.username,
                osuID: tournament.organizer.osu.userID,
                avatar: tournament.organizer.osu.avatar,
                country: tournament.organizer.country,
                loggedIn: true,
            }],
        }];

        for (const role of roles) {
            const discordRole = await server.roles.fetch(role.roleID);
            if (!discordRole || discordRole.members.filter(m => !m.user.bot).size === 0)
                continue;

            const members = discordRole.members.filter(m => !m.user.bot);
            const dbUsers = await User
                .createQueryBuilder("user")
                .where("user.discordUserid IN (:...ids)", { ids: members.map(m => m.id) })
                .getMany();
            const users = members.map<StaffMember>(m => {
                const dbUser = dbUsers.find(u => u.discord.userID === m.id);
                return {
                    ID: dbUser?.ID,
                    username: dbUser?.osu.username ?? m.user.username,
                    osuID: dbUser?.osu.userID,
                    avatar: dbUser?.osu.avatar || dbUser?.discord.avatar || m.displayAvatarURL(),
                    country: dbUser?.country,
                    loggedIn: dbUser !== undefined,
                };
            }).sort((a, b) => a.username.localeCompare(b.username));

            staff.push({
                role: discordRole.name,
                roleType: role.roleType,
                users,
            });
        }

        ctx.body = staff;
    } catch (e) {
        ctx.body = {
            success: false,
            error: `Error fetching staff list\n${e}`,
        };
    }
});

export default tournamentRouter;