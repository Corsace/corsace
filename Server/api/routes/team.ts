import Router from "@koa/router";
import { config } from "node-config-ts";
import { DiscordAPIError } from "discord.js";
import { nameFilter } from "../../../Interfaces/team";
import { Team } from "../../../Models/tournaments/team";
import { Tournament } from "../../../Models/tournaments/tournament";
import { discordGuild, getMember } from "../../discord";
import { isManager, isNotInTournament, membersNotInTournament } from "../../middleware/tournaments";
import { isLoggedInDiscord } from "../../middleware";

const teamRouter = new Router;

// Get list of teams user is in
teamRouter.get("/", async (ctx) => {
    return await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .where("member.ID = :userID", { userID: ctx.state.user.ID })
        .orWhere("manager.ID = :userID", { userID: ctx.state.user.ID })
        .getMany();
});

// Get list of teams in a specified tournament
teamRouter.get("/:tournament/teams", async (ctx) => {
    if (await ctx.cashed())
        return;

    const tournament = await Tournament.findOne(ctx.params.tournament);
    if (!tournament)
        return ctx.body = { error: "Tournament not found!" };

    return tournament.getTeams();
});

// Create a team for a tournament
teamRouter.post("/:tournament/create", isLoggedInDiscord, isNotInTournament, async (ctx) => {
    const tournament = await Tournament.findOne(ctx.params.tournament);
    if (!tournament)
        return ctx.body = { error: "Tournament not found!" };
    
    const data = ctx.request.body;
    let name = data.name;
    if (!name)
        return ctx.body = { error: "Missing team name!" };

    if (/^team /i.test(name))
        name = name.replace(/^team /i, "")
    if (name.length > 20 || name.length < 3 || nameFilter.test(name))
        return ctx.body = { error: "Invalid team name!" };

    try {

        const team = new Team;
        team.name = data.name;
        team.manager = ctx.state.user;
        team.averageBWS = 0;
        team.managerIsPlaying = data.managerIsPlaying;

        const guild = await discordGuild();
        let member = await getMember(ctx.state.user.discord.userID);
        if (!member) {
            member = await guild.members.add(ctx.state.user.discord.userID, {
                accessToken: ctx.state.user.discord.accessToken,
                nick: ctx.state.user.osu.username,
                roles: [config.discord.roles.open.captains, config.discord.roles.open.participants, config.discord.roles.corsace.verified, config.discord.roles.corsace.streamAnnouncements],
                // TODO: Moving these config roles into the DB when the Corsace tournament organizing system is usable for anyone
            });
        }

        const role = await guild.roles.create({
            name: `CO22 TEAM ${team.name}`,
            hoist: false,
            mentionable: false,
        });

        team.role = role.id;
        await team.save();

        const rolesToAdd = [ team.role ];
        if (!member.roles.cache.has(config.discord.roles.open.captains))
            rolesToAdd.push(config.discord.roles.open.captains);
        if (!member.roles.cache.has(config.discord.roles.open.participants))
            rolesToAdd.push(config.discord.roles.open.participants);
        if (!member.roles.cache.has(config.discord.roles.corsace.verified))
            rolesToAdd.push(config.discord.roles.corsace.verified);
        await member.roles.add(rolesToAdd);

        if (member.displayName !== ctx.state.user.osu.username)
            await member.setNickname(ctx.state.user.osu.username);


        return team.getInfo(true);
    } catch (e) {
        if (e instanceof DiscordAPIError && e.code === 30001)
            return ctx.body = { error: "You are currently in too many discord servers!" };
        else if (!ctx.headerSent && (e as any).name === "ValidationError")
            return ctx.body = { error: (e as any).message };
        throw e;
    }
});

// Join tournament with a pre-made team
teamRouter.post("/:tournament/:team/join", isManager, membersNotInTournament, async (ctx) => {
    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "teams")
        .where("tournament.ID = :tournament", { tournament: ctx.params.tournament })
        .getOne();
    if (!tournament)
        return ctx.body = { error: "Tournament not found!" };

    tournament.teams.push(ctx.state.team);
    await tournament.save();

    return ctx.body = { success: "Team joined tournament!" };
});

// Leave tournament with a pre-made team
teamRouter.post("/:tournament/:team/leave", isManager, async (ctx) => {
    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "teams")
        .where("tournament.ID = :tournament", { tournament: ctx.params.tournament })
        .getOne();
    if (!tournament)
        return ctx.body = { error: "Tournament not found!" };

    tournament.teams.filter(team => team.ID !== ctx.state.team.ID);
    await tournament.save();

    return ctx.body = { success: "Team left tournament!" };
});