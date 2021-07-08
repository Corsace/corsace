import { config } from "node-config-ts";
import { getMember } from "./discord";
import { ParameterizedContext, Next } from "koa";
import { Team } from "../Models/team";
import { Tournament } from "../Models/tournaments/tournament";
import { LessThan, MoreThan } from "typeorm";

interface discordRoleInfo {
    section: string;
    role: string;
}

// General middlewares
async function isLoggedIn (ctx: ParameterizedContext, next: Next): Promise<void> {
    if (!ctx.state.user) {
        ctx.body = { error: "User is not logged in via osu!" };
        return;
    }

    await next();
}

async function isLoggedInDiscord (ctx: ParameterizedContext, next: Next): Promise<void> {
    if (!ctx.state.user?.discord?.userID) {
        ctx.body = { error: "User is not logged in via discord!" };
        return; 
    }

    await next();
}

async function isStaff (ctx: ParameterizedContext, next: Next): Promise<void> {
    const member = await getMember(ctx.state.user.discord.userID);
    if (member) {
        const roles = [
            config.discord.roles.corsace.corsace,
            config.discord.roles.corsace.headStaff,
            config.discord.roles.corsace.staff,
        ];
        for (const role of roles)
            if (member.roles.cache.has(role)) {
                await next();
                return;
            }
    }
    
    ctx.body = { error: "User is not a staff member!" };
    return; 
}

function hasRole (section: string, role: string) {
    return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
        const member = await getMember(ctx.state.user.discord.userID);
        if (
            member && 
            (
                member.roles.cache.has(config.discord.roles[section][role]) || 
                member.roles.cache.has(config.discord.roles.corsace.corsace) || 
                (role === "corsace" ? false : member.roles.cache.has(config.discord.roles.corsace.headStaff))
            )
        ) {
            await next();
            return;
        } 
        
        ctx.body = { error: "User does not have the " + role + " role!" };
        return;
    };
}

function hasRoles(roles: discordRoleInfo[]) {
    return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
        const member = await getMember(ctx.state.user.discord.userID);
        if (!member) {
            ctx.body = { error: "Could not obtain any discord user!" };
            return;
        }

        if (
            member.roles.cache.has(config.discord.roles.corsace.corsace) || 
            (roles.some(role => role.section == "corsace" && role.role == "corsace") ? false : member.roles.cache.has(config.discord.roles.corsace.headStaff))
        ) {
            await next();
            return;
        }
        for (const role of roles) {
            if (member.roles.cache.has(config.discord.roles[role.section][role.role]))
            {
                await next();
                return;
            }
        }
        
        ctx.body = { error: "User does not have any of the required roles!" };
        return;
    };
}

const isMCAStaff = hasRoles([{
    section: "mca",
    role: "standard",
}, {
    section: "mca",
    role: "taiko",
}, {
    section: "mca",
    role: "fruits",
}, {
    section: "mca",
    role: "mania",
}, {
    section: "mca",
    role: "storyboard",
}]);
const isHeadStaff = hasRole("corsace", "headStaff");
const isCorsace = hasRole("corsace", "corsace");

// Tournament middlewares
async function notOpenStaff (ctx: ParameterizedContext, next: Next): Promise<void> {
    const member = await getMember(ctx.state.user.discord.userID);
    if (!member) {
        await next();
        return;
    }

    if (
        member.roles.cache.has(config.discord.roles.corsace.corsace) ||
        member.roles.cache.has(config.discord.roles.corsace.headStaff) ||
        member.roles.cache.has(config.discord.roles.corsace.scheduler) ||
        member.roles.cache.has(config.discord.roles.open.mappooler) ||
        member.roles.cache.has(config.discord.roles.open.mapper) ||
        member.roles.cache.has(config.discord.roles.open.testplayer) ||
        member.roles.cache.has(config.discord.roles.open.scrim) ||
        member.roles.cache.has(config.discord.roles.open.advisor) ||
        member.roles.cache.has(config.discord.roles.open.streamer) ||
        member.roles.cache.has(config.discord.roles.open.referee)
    ) {
        ctx.body = { error: "You are a staff member and cannot play for Corsace Open."}
        return;
    }
}

async function isRegistration (ctx: ParameterizedContext, next: Next): Promise<void> {
    const date = new Date();
    const tournament = await Tournament.findOne({
        registration: {
            start: LessThan(date),
            end: MoreThan(date),
        }
    });
    if (!tournament) {
        ctx.body = { error: "No tournament with registration phase currently!" }
        return;
    }

    ctx.state.tournament = tournament;
    await next();
}

async function hasTeam (ctx: ParameterizedContext, next: Next): Promise<void> {
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
    if (!team) {
        ctx.body = { error: "You have no team currently"};
        return;
    }

    ctx.state.team = team;
    await next();
}

async function hasNoTeam (ctx: ParameterizedContext, next: Next): Promise<void> {
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
    if (team) {
        ctx.body = { error: "You have a team currently"};
        return;
    }

    await next();
}

async function isCaptain (ctx: ParameterizedContext, next: Next): Promise<void> {
    const team = await Team.findOne({
        captain: ctx.state.user
    });
    if (!team) {
        ctx.body = { error: "You are not captain of a team currently!"};
        return;
    }

    ctx.state.team = team;
    await next();
}

export { 
    isLoggedIn, isLoggedInDiscord, 
    isStaff, isMCAStaff, isHeadStaff, isCorsace, hasRole, hasRoles,
    notOpenStaff, 
    isRegistration,
    hasTeam, hasNoTeam,
    isCaptain, 
};