import { ParameterizedContext, Next } from "koa";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { ModeDivisionType } from "../../Models/MCA_AYIM/modeDivision";
import { MCA } from "../../Models/MCA_AYIM/mca";
import { User } from "../../Models/user";
import { Vote } from "../../Models/MCA_AYIM/vote";
import { Nomination } from "../../Models/MCA_AYIM/nomination";
import { Category } from "../../Models/MCA_AYIM/category";

async function isEligible (ctx: ParameterizedContext, next: Next): Promise<void> {
    const mca: MCA = ctx.state.mca;
    const user: User = ctx.state.user;
    
    if (user.mcaEligibility.find(e => e.year === mca.year)) {
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

async function currentMCA (ctx: ParameterizedContext, next: Next): Promise<any> {
    const mca = await MCA.findOne({
        results: MoreThanOrEqual(new Date()),
        nomination: {
            start: LessThanOrEqual(new Date()),
        },
    });

    if (!mca) {
        return ctx.body = {
            error: "No MCA found for this year",
        };
    }

    ctx.state.mca = mca;

    await next();
}

async function validatePhaseYear (ctx: ParameterizedContext, next: Next): Promise<any> {
    let year = ctx.params.year;

    if (!year || !/20\d\d/.test(year)) {
        ctx.state.mca = await MCA.current();
        year = ctx.state.mca.year;
    } else {
        year = parseInt(year, 10);
        ctx.state.mca = await MCA.findOneOrFail(year);
    }

    ctx.state.year = year;

    await next();
}

function isPhase (phase: string) {
    return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
        const mca: MCA = ctx.state.mca;
        const now = new Date();

        if (now < mca[phase].start || now > mca[phase].end) {
            ctx.body = { error: "Not the right time" };
            return;
        }

        await next();
        return;
    };
}

function isPhaseStarted (phase: string) {
    return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
        const mca: MCA = ctx.state.mca;
        const now = new Date();

        if (now < mca[phase].start) {
            ctx.body = { error: "Not the right time" };
            return;
        }

        await next();
        return;
    };
}

export { isEligible, isEligibleFor, currentMCA, validatePhaseYear, isPhase, isPhaseStarted };
