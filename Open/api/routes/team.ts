import Router, { Middleware } from "@koa/router";
import { config } from "node-config-ts";
import { Team } from "../../../Models/team";
import { discordGuild, getMember } from "../../../Server/discord";
import { hasNoTeam, isCaptain, isLoggedInDiscord, isRegistration, notOpenStaff } from "../../../Server/middleware";

const teamRouter = new Router();

const teamPayloadValidation: Middleware = async (ctx, next) => {
    const data = ctx.request.body;

    if (!data.name) {
        ctx.body = { error: "Missing team name!"};
    } 

    await next();
}

// Gets user's team
teamRouter.get("/", isLoggedInDiscord, async (ctx) => {
    const team = await Team.findOne({
        where: [
            {
                captain: ctx.state.user
            },
            {
                players: {
                    Any: ctx.state.user,
                }
            }
        ]
    });

    ctx.body = {
        team: team ?? null,
    };
});

// Gets all teams
teamRouter.get("/:id", async (ctx) => {
    if (!/\d+/.test(ctx.params.id))
        return ctx.body = { error: `${ctx.params.id} is an invalid ID` };
    const teams = await Team.findOne({
        where: {
            tournaments: {
                Any: ctx.params.id,
            },
        },
    });

    ctx.body = teams;
});

// Create team
teamRouter.post("/", isLoggedInDiscord, notOpenStaff, hasNoTeam, isRegistration, teamPayloadValidation, async (ctx) => {
    const name = ctx.request.body.name;
    const guild = await discordGuild();
    const team = new Team;

    team.name = name;
    team.captain = ctx.state.user;
    team.tournament = ctx.state.tournament;
    const role = await guild.roles.create({
        data: {
            name,
            hoist: false,
            mentionable: false,
        }
    });
    team.role = role.id;
    await team.save();
    
    const member = await getMember(ctx.state.user.discord.userID);
    if (!member) {
        await guild.addMember(ctx.state.user.discord.userID, {
            accessToken: await ctx.state.user.getAccessToken("discord"),
            nick: ctx.state.user.osu.username,
            roles: [config.discord.roles.corsace.verified, config.discord.roles.open.participants, config.discord.roles.open.captains, team.role],
        });
    } else {
        await Promise.all([
            member.setNickname(ctx.state.user.osu.username),
            member.roles.add([config.discord.roles.corsace.verified, config.discord.roles.open.participants, config.discord.roles.open.captains, team.role]),
        ]);
    }
});

// Rename team
teamRouter.put("/rename", isLoggedInDiscord, isCaptain, teamPayloadValidation, async (ctx) => {
    const name = ctx.request.body.name;
    const guild = await discordGuild();
    const team: Team = ctx.state.team;
    const oldName = team.name;

    team.name = name;
    await team.save();

    await guild.roles.resolve(team.role)?.edit(
        { name: team.name }, 
        `Captain has changed their team name from ${oldName} to ${team.name}`,
    );
});

// Add avatar
teamRouter.post("/avatar", isLoggedInDiscord, isCaptain, async (ctx) => {
    console.log(ctx.request.body);
    ctx.body = "Ok Lol Chillll";    
});

export default teamRouter;
