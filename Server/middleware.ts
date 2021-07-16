import { config } from "node-config-ts";
import { getMember } from "./discord";
import { ParameterizedContext, Next } from "koa";

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

function hasRoles (roles: discordRoleInfo[]) {
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

export { isLoggedIn, isLoggedInDiscord, isStaff, isMCAStaff, isHeadStaff, isCorsace, hasRole, hasRoles };