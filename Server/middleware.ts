import { Config } from "../config";
import { discordGuild } from "./discord";
import { ParameterizedContext, Next } from "koa";

// General middlewares
const config = new Config();

async function isLoggedIn (ctx: ParameterizedContext, next: Next): Promise<void> {
    if (!ctx.state.user) {
        ctx.body = { error: "No user found!" };
        return;
    }

    await next();
}

async function isLoggedInDiscord (ctx: ParameterizedContext, next: Next): Promise<void> {
    if (!ctx.state.user?.discord?.accessToken) {
        ctx.body = { error: "User is not logged in via discord!" };
        return; 
    }

    await next();
}

async function isLoggedInOsu (ctx: ParameterizedContext, next: Next): Promise<void> {
    if (!ctx.state.user?.osu?.accessToken) {
        ctx.body = { error: "User is not logged in via osu!" };
        return; 
    }

    await next();
}

async function isStaff (ctx: ParameterizedContext, next: Next): Promise<void> {
    const member = await (await discordGuild()).members.fetch(ctx.state.user.discord.userID);
    if (member) {
        const roles = [
            config.discord.roles.corsace.staff,
            config.discord.roles.open.staff,
            config.discord.roles.invitational.staff,
            config.discord.roles.mca.staff,
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
        const member = await (await discordGuild()).members.fetch(ctx.state.user.discord.userID);
        if (member && (member.roles.cache.has(config.discord.roles[section][role]) || member.roles.cache.has(config.discord.roles.corsace.corsace))) {
            await next();
            return;
        } 
        
        ctx.body = { error: "User does not have the " + role + " role!" };
        return;
    };
}

const isMCAStaff = hasRole("mca", "staff");
const isHeadStaff = hasRole("corsace", "headStaff");
const isCorsace = hasRole("corsace", "corsace");

export { isLoggedIn, isLoggedInDiscord, isLoggedInOsu, isStaff, isMCAStaff, isHeadStaff, isCorsace, hasRole };