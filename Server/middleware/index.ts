import { config } from "node-config-ts";
import { getMember } from "../discord";
import { ParameterizedContext, Next } from "koa";
import { GuildMember } from "discord.js";

type discordRoleSection = keyof typeof config.discord.roles;
type discordRolesInSection<T extends discordRoleSection> = keyof typeof config.discord.roles[T];

interface discordRoleInfo<T extends discordRoleSection> {
    section: T;
    role: discordRolesInSection<T>;
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
    if (!ctx.state.user?.discord?.userID) {
        ctx.body = { error: "User is not logged in via discord!" };
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
    
    ctx.body = { error: "User is not a staff member!" };
    return; 
}

function memberHasRole<T extends discordRoleSection> (member: GuildMember, section: T, role: discordRolesInSection<T>): boolean {
    const configRole = config.discord.roles[section][role] as string | string[];
    return Array.isArray(configRole) 
        ? configRole.some(r => member.roles.cache.has(r)) 
        : member.roles.cache.has(configRole);
}

function hasRole<T extends discordRoleSection> ({ section, role }: discordRoleInfo<T>) {
    return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
        if (!ctx.state.user?.discord?.userID) {
            ctx.body = { error: "User is not logged in via discord!" };
            return; 
        }

        const member = await getMember(ctx.state.user.discord.userID);
        if (member) {
            if (memberHasRole(member, "corsace", "corsace") || memberHasRole(member, "corsace", "core")) {
                await next();
                return;
            }

            if (memberHasRole(member, section, role)) {
                await next();
                return;
            }
        } 
        
        ctx.body = { error: `User does not have the ${String(role)} role!` };
        return;
    };
}

function hasRoles (roles: discordRoleInfo<discordRoleSection>[]) {
    return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
        if (!ctx.state.user?.discord?.userID) {
            ctx.body = { error: "User is not logged in via discord!" };
            return; 
        }

        const member = await getMember(ctx.state.user.discord.userID);
        if (!member) {
            ctx.body = { error: "Could not obtain any discord user!" };
            return;
        }

        if (memberHasRole(member, "corsace", "corsace") || memberHasRole(member, "corsace", "core")) {
            await next();
            return;
        }

        if (roles.some(role => memberHasRole(member, role.section, role.role))) {
            await next();
            return;
        }
        
        ctx.body = { error: "User does not have any of the required roles!" };
        return;
    };
}

const isHeadStaff = hasRole({ section: "corsace", role: "headStaff" });
const isCorsace = hasRole({ section: "corsace", role: "corsace" });

export { isLoggedIn, isLoggedInDiscord, isStaff, isHeadStaff, isCorsace, hasRole, hasRoles };