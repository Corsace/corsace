import { config } from "node-config-ts";
import { getMember } from "../discord";
import { DefaultState, Next } from "koa";
import { GuildMember } from "discord.js";
import { CorsaceContext } from "../corsaceRouter";

type discordRoleSection = keyof typeof config.discord.roles;
type discordRolesInSection<T extends discordRoleSection> = keyof typeof config.discord.roles[T];

interface discordRoleInfo<T extends discordRoleSection> {
    section: T;
    role: discordRolesInSection<T>;
}

// Middleware helper functions
function checkUserDiscordLogin<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>): boolean {
    if (!ctx.state.user?.discord?.userID) {
        ctx.body = {
            success: false,
            error: "User is not logged in via discord!",
        };
        return false;
    }
    return true;
}

function memberHasRole<T extends discordRoleSection> (member: GuildMember, section: T, role: discordRolesInSection<T>): boolean {
    const configRole = config.discord.roles[section][role] as string | string[];
    return Array.isArray(configRole) 
        ? configRole.some(r => member.roles.cache.has(r)) 
        : member.roles.cache.has(configRole);
}

async function checkUserRoles<T extends discordRoleSection, S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, roles: discordRoleInfo<T>[], ignoreMissingMember = false): Promise<boolean> {
    const member = await getMember(ctx.state.user?.discord?.userID ?? "");
    if (!member) {
        if(!ignoreMissingMember)
            ctx.body = {
                success: false,
                error: "Could not obtain any discord user!",
            };
        return false;
    }

    if (memberHasRole(member, "corsace", "corsace") || memberHasRole(member, "corsace", "core")) {
        return true;
    }

    return roles.some(role => memberHasRole(member, role.section, role.role));
}

// General middlewares
async function isLoggedIn<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next) {
    if (!ctx.state.user) {
        ctx.body = {
            success: false,
            error: "User is not logged in via osu!",
        };
        return;
    }

    await next();
}

async function isLoggedInDiscord<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next) {
    if (!checkUserDiscordLogin(ctx)) {
        ctx.body = {
            success: false,
            error: "User is not logged in via discord!",
        };
        return; 
    }

    await next();
}

async function isStaff<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next) {
    if (!ctx.state.user?.discord?.userID) {
        ctx.body = {
            success: false,
            error: "User is not logged in via discord!",
        };
        return; 
    }

    const member = await getMember(ctx.state.user.discord.userID);
    if (member) {
        const roles = [
            config.discord.roles.corsace.corsace,
            config.discord.roles.corsace.core,
            ...config.discord.roles.corsace.headStaff,
            config.discord.roles.corsace.staff,
        ];
        for (const role of roles)
            if (member.roles.cache.has(role)) {
                await next();
                return;
            }
    }
    
    ctx.body = {
        success: false,
        error: "User is not a staff member!",
    };
    return; 
}

function hasRole<T extends discordRoleSection> (role: discordRoleInfo<T>) {
    return async<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next) => {
        if (!checkUserDiscordLogin(ctx)) return;
        
        if (await checkUserRoles(ctx, [role])) {
            await next();
            return;
        }

        ctx.body = {
            success: false,
            error: `User does not have the ${String(role)} role!`,
        };
        return;
    };
}

function hasRoles<T extends discordRoleSection> (roles: discordRoleInfo<T>[]) {
    return async<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next) => {
        if (!checkUserDiscordLogin(ctx)) return;
        
        if (await checkUserRoles(ctx, roles)) {
            await next();
            return;
        }

        ctx.body = {
            success: false,
            error: "User does not have any of the required roles!",
        };
        return;
    };
}

const isHeadStaff = hasRole({ section: "corsace", role: "headStaff" });
const isCorsace = hasRole({ section: "corsace", role: "corsace" });

export { checkUserRoles, isLoggedIn, isLoggedInDiscord, isStaff, isHeadStaff, isCorsace, hasRole, hasRoles };
