import { CorsaceContext, CorsaceRouter } from "../../../corsaceRouter";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Tournament } from "../../../../Models/tournaments/tournament";
import { BaseQualifier } from "../../../../Interfaces/qualifier";
import { Next } from "koa";
import { TeamList, TeamMember } from "../../../../Interfaces/team";
import { StaffList, StaffMember } from "../../../../Interfaces/staff";
import { Team } from "../../../../Models/tournaments/team";
import { playingRoles, TournamentRoleType, tournamentStaffRoleOrder } from "../../../../Interfaces/tournament";
import { discordClient } from "../../../discord";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { User } from "../../../../Models/user";
import { createHash } from "crypto";
import { Stage } from "../../../../Models/tournaments/stage";

async function validateID (ctx: CorsaceContext<object>, next: Next) {
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

const tournamentRouter  = new CorsaceRouter();

tournamentRouter.$get<{ tournament: Tournament }>("/open/:year", async (ctx) => {
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
        .innerJoinAndSelect("tournament.organizer", "organizer")
        .where("tournament.year <= :year", { year })
        .andWhere("tournament.isOpen = true")
        .andWhere("tournament.status != '0'")
        .orderBy("tournament.year", "DESC")
        .getOne();

    if (!tournament) {
        ctx.body = {
            success: false,
            error: "Tournament not found",
        };
        return;
    }

    tournament.stages = await Stage
        .createQueryBuilder("stage")
        .leftJoinAndSelect("stage.rounds", "rounds")
        .where("stage.tournamentID = :ID", { ID: tournament.ID })
        .getMany();

    tournament.stages.sort((a, b) => a.order - b.order);
    tournament.stages.forEach(async stage => {
        stage.rounds.forEach(async round => {
            round.mappool = await Mappool
                .createQueryBuilder("mappool")
                .leftJoinAndSelect("mappool.slots", "slots")
                .leftJoinAndSelect("slots.maps", "maps")
                .where("mappool.roundID = :ID", { ID: round.ID })
                .getMany();

            round.mappool.forEach(mappool => {
                if (!mappool.isPublic) {
                    mappool.mappackLink = null;
                    mappool.mappackExpiry = null;
                }
            });
        });

        stage.mappool = await Mappool
            .createQueryBuilder("mappool")
            .leftJoinAndSelect("mappool.slots", "slots")
            .leftJoinAndSelect("slots.maps", "maps")
            .where("mappool.stageID = :ID", { ID: stage.ID })
            .getMany();

        stage.mappool.forEach(mappool => {
            if (!mappool.isPublic) {
                mappool.mappackLink = null;
                mappool.mappackExpiry = null;
            }
        });
    });

    ctx.body = {
        success: true,
        tournament,
    };
});

tournamentRouter.$get<{ tournamentID?: number }>("/validateKey", async (ctx) => {
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
        .getOne();

    ctx.body = {
        success: true,
        tournamentID: keyCheck?.ID,
    };
});

tournamentRouter.$get<{ teams: TeamList[] }>("/:tournamentID/teams", validateID, async (ctx) => {
    const ID = ctx.state.ID;

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
        .innerJoinAndSelect("team.captain", "captain")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .leftJoin("team.tournaments", "tournament")
        .where("tournament.ID = :ID", { ID })
        .getMany();

    ctx.body = {
        success: true,
        teams: teams.map<TeamList>(t => {
            const members = t.members;
            if (!members.some(m => m.ID === t.captain.ID))
                members.push(t.captain);
            return {
                ID: t.ID,
                name: t.name,
                avatarURL: t.avatarURL,
                pp: t.pp,
                BWS: t.BWS,
                rank: t.rank,
                members: members.map<TeamMember>(m => ({
                    ID: m.ID,
                    username: m.osu.username,
                    osuID: m.osu.userID,
                    country: m.country,
                    rank: m.userStatistics?.find(s => s.modeDivision.ID === tournament.mode.ID)?.rank ?? 0,
                    isCaptain: m.ID === t.captain.ID,
                })),
            };
        }),
    };
});

tournamentRouter.$get<{ teams: TeamList[] }>("/:tournamentID/unregisteredTeams", validateID, async (ctx) => {
    const ID = ctx.state.ID;

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
        .innerJoinAndSelect("team.captain", "captain")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "mode")
        .leftJoin("team.tournaments", "tournament")
        .where("tournament.ID IS NULL OR tournament.ID <> :ID", { ID })
        .orderBy("team.ID", "DESC")
        .getMany();

    ctx.body = {
        success: true,
        teams: teams.map<TeamList>(t => {
            const members = t.members;
            if (!members.some(m => m.ID === t.captain.ID))
                members.push(t.captain);
            return {
                ID: t.ID,
                name: t.name,
                avatarURL: t.avatarURL,
                pp: t.pp,
                BWS: t.BWS,
                rank: t.rank,
                members: members.map<TeamMember>(m => ({
                    ID: m.ID,
                    username: m.osu.username,
                    osuID: m.osu.userID,
                    country: m.country,
                    rank: m.userStatistics?.find(s => s.modeDivision.ID === tournament.mode.ID)?.rank ?? 0,
                    isCaptain: m.ID === t.captain.ID,
                })),
            };
        }),
    };
});

// <any> is used here to be able to send a raw csv file to the endpoint user
tournamentRouter.$get<any>("/:tournamentID/teams/screening", validateID, async (ctx) => {
    const ID = ctx.state.ID;

    const teams = await Team
        .createQueryBuilder("team")
        .innerJoin("team.tournament", "tournament")
        .innerJoinAndSelect("team.captain", "captain")
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
        if (!members.some(m => m.ID === t.captain.ID))
            members.push(t.captain);
        return members.map(m => `${m.osu.username},${t.name},${m.osu.userID}`).join("\n");
    }).join("\n");

    ctx.set("Content-Type", "text/csv");
    ctx.body = csv;
});

tournamentRouter.$get<{ qualifiers: BaseQualifier[] }>("/:tournamentID/qualifiers", validateID, async (ctx) => {
    const ID = ctx.state.ID;

    const qualifiers = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.teams", "team")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .where("tournament.ID = :ID", { ID })
        .andWhere("stage.stageType = '0'")
        .getMany();
    
    ctx.body = {
        success: true,
        qualifiers: qualifiers.flatMap<BaseQualifier>(q => {
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
        }),
    };
});

tournamentRouter.$get<{ staff: StaffList[] }>("/:tournamentID/staff", validateID, async (ctx) => {
    if (await ctx.cashed())
        return;

    const ID = ctx.state.ID;

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

        const staff: StaffList[] = [{
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
                    avatar: dbUser?.osu.avatar ?? dbUser?.discord.avatar ?? m.displayAvatarURL(),
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

        ctx.body = {
            success: true,
            staff,
        };
    } catch (e) {
        ctx.body = {
            success: false,
            error: `Error fetching staff list\n${e}`,
        };
    }
});

export default tournamentRouter;
