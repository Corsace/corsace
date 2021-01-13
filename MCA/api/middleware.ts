import { ParameterizedContext, Next } from "koa";
import { ModeDivisionType } from "../../Models/MCA_AYIM/modeDivision";
import { MCA } from "../../Models/MCA_AYIM/mca";
import { User } from "../../Models/user";

async function isEligible (ctx: ParameterizedContext, next: Next): Promise<void> {
    if (!ctx.params.year) {
        ctx.body = { error: "No year given!" };
        return;
    }
    
    for (const eligibility of ctx.state.user.mca) {
        if (eligibility.year === parseInt(ctx.params.year)) {
            await next();
            return;
        }
    }
    
    ctx.body = { error: "User is currently not eligible!" };
}

async function isNotEligible (ctx: ParameterizedContext, next: Next): Promise<void> {
    if (!ctx.params.year) {
        ctx.body = { error: "No year given!" };
        return;
    }
    
    for (const eligibility of ctx.state.user.mca) {
        if (eligibility.year === parseInt(ctx.params.year)) {
            ctx.body = { error: "User is currently eligible!" };
            return;
        }
    }
    
    await next();
}

async function isEligibleCurrentYear (ctx: ParameterizedContext, next: Next): Promise<void> {
    const currentYear = new Date().getFullYear() - 1;
    
    if (ctx.state.user.mcaEligibility.find(e => e.year === currentYear)) {
        return await next();
    }
    
    ctx.body = {
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

async function validatePhaseYear (ctx: ParameterizedContext, next: Next): Promise<any> {
    let year = ctx.params.year;
    if (!year || !/20\d\d/.test(year)) {
        const date = new Date;
        year = date.getUTCFullYear() - 1;
    }
    ctx.state.year = year;

    await next();
}

function isPhase (phase: string) {
    return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
        const mca = await MCA.findOne((new Date).getUTCFullYear() - 1);
        const now = new Date();

        if (!mca || now < mca[phase].start || now > mca[phase].end) {
            ctx.body = { error: "Not the right time" };
            return;
        }

        await next();
        return;
    };
}

function isPhaseStarted (phase: string) {
    return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
        
        const mca = await MCA.findOne(ctx.state.year);
        const now = new Date();

        if (!mca || now < mca[phase].start) {
            ctx.body = { error: "Not the right time" };
            return;
        }

        await next();
        return;
    };
}

export { isEligible, isNotEligible, isEligibleCurrentYear, isEligibleFor, validatePhaseYear, isPhase, isPhaseStarted };
