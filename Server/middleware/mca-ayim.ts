import { config } from "node-config-ts";
import { DefaultState, Next } from "koa";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { MCA } from "../../Models/MCA_AYIM/mca";
import { User } from "../../Models/user";
import { getMember } from "../discord";
import { hasRoles } from ".";
import { ModeDivisionType } from "../../Interfaces/modes";
import { CorsaceContext, CorsaceMiddleware } from "../corsaceRouter";

async function isEligible<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next) {
    if (!ctx.state.user) {
        ctx.body = { 
            success: false,
            error: "User is not logged in via osu! for the isEligible middleware!",
        };
        return;
    }

    if (!ctx.state.mca) {
        ctx.body = {
            success: false,
            error: "MCA not found for the isEligible middleware!",
        };
        return;
    }

    const mca = ctx.state.mca;
    const user = ctx.state.user;
    
    if (user.mcaEligibility.find(e => e.year === mca.year)) {
        await next();
        return;
    }
    
    ctx.body = {
        success: false,
        error: "User wasn't active last year!",
    };
}

function isEligibleFor (user: User, modeID: number, year: number): boolean {
    switch (modeID) {
        case ModeDivisionType.standard:
            return user.mcaEligibility.some(e => e.standard && e.year == year);
        
        case ModeDivisionType.taiko:
            return user.mcaEligibility.some(e => e.taiko && e.year == year);
    
        case ModeDivisionType.fruits:
            return user.mcaEligibility.some(e => e.fruits && e.year == year);

        case ModeDivisionType.mania:
            return user.mcaEligibility.some(e => e.mania && e.year == year);

        case ModeDivisionType.storyboard:
            return user.mcaEligibility.some(e => e.storyboard && e.year == year);

        default:
            return false;
    }
}

async function currentMCA<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next) {
    const mca = await MCA.findOne({
        where: {
            results: MoreThanOrEqual(new Date()),
            nomination: {
                start: LessThanOrEqual(new Date()),
            },
        },
    });

    if (!mca) {
        return ctx.body = {
            success: false,
            error: "No MCA found for this year",
        };
    }

    ctx.state.mca = mca;

    await next();
}

async function validatePhaseYear<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next) {
    try {
        let year = ctx.params.year;
        if (!year || !/^20[0-9]{2}$/.test(year)) {
            ctx.state.mca = await MCA.current();
            year = ctx.state.mca.year;
        } else {
            year = parseInt(year, 10);
            ctx.state.mca = await MCA.findOneOrFail({ where: { year } });
        }

        ctx.state.year = year;
    } catch (e) {
        ctx.body = { 
            success: false,
            error: "No Currently running MCA found.",
        };
        return;
    }
    
    await next();
}

function isPhase<S extends DefaultState = DefaultState> (phase: "nomination" | "voting"): CorsaceMiddleware<object, S> {
    return async (ctx: CorsaceContext<object, S>, next: Next): Promise<void> => {
        if (!ctx.state.mca) {
            ctx.body = {
                success: false,
                error: "MCA not found for the isPhase middleware!",
            };
            return;
        }

        const mca = ctx.state.mca;
        const now = new Date();

        if (now < mca[phase].start || now > mca[phase].end) {
            ctx.body = {
                success: false,
                error: "Not the right time",
            };
            return;
        }

        await next();
        return;
    };
}

function isPhaseStarted<S extends DefaultState = DefaultState> (phase: "nomination" | "voting"): CorsaceMiddleware<object, S> {
    return async (ctx: CorsaceContext<object, S>, next: Next): Promise<void> => {
        if (!ctx.state.mca) {
            ctx.body = {
                success: false,
                error: "MCA not found for the isPhaseStarted middleware!",
            };
            return;
        }

        const mca = ctx.state.mca;
        const now = new Date();

        if (now < mca[phase].start) {
            ctx.body = {
                success: false, 
                error: "Not the right time",
            };
            return;
        }

        await next();
        return;
    };
}

async function isResults<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next) {
    // Check if there is an MCA and if it's in the results phase
    if (!ctx.state.mca) {
        ctx.body = {
            success: false,
            error: "MCA not found for the isResults middleware!",
        };
        return;
    }

    if (ctx.state.mca.currentPhase() === "results") {
        await next();
        return;
    }
    
    // Check if the user is logged is a staff member or a head staff member in the discord server if it's not the results phase
    if (!ctx.state.user?.discord?.userID) {
        ctx.body = {
            success: false,
            error: "User is not logged in via discord for the isResults middleware!",
        };
        return;
    }

    const member = await getMember(ctx.state.user.discord.userID);
    if (!member) {
        ctx.body = {
            success: false,
            error: "Not the right time",
        };
        return;
    }
    if (
        member.roles.cache.has(config.discord.roles.corsace.corsace) ||
        member.roles.cache.has(config.discord.roles.corsace.core) ||
        member.roles.cache.has(config.discord.roles.mca.standard) ||
        member.roles.cache.has(config.discord.roles.mca.taiko) ||
        member.roles.cache.has(config.discord.roles.mca.fruits) ||
        member.roles.cache.has(config.discord.roles.mca.mania) ||
        member.roles.cache.has(config.discord.roles.mca.storyboard) ||
        config.discord.roles.corsace.headStaff.some(r => member.roles.cache.has(r))
    ) {
        await next();
        return;
    }
}

const isMCAStaff = hasRoles<"mca">([{
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

export { isEligible, isEligibleFor, currentMCA, validatePhaseYear, isPhase, isPhaseStarted, isResults, isMCAStaff };