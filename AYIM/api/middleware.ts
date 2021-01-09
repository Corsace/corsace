import { ParameterizedContext, Next } from "koa";
import Router from "koa-router";
import { ModeDivisionType } from "../../Models/MCA_AYIM/modeDivision";

async function isEligible(ctx: ParameterizedContext<any, Router.IRouterParamContext<any, {}>>, next: Next): Promise<void> {
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

async function isNotEligible(ctx: ParameterizedContext<any, Router.IRouterParamContext<any, {}>>, next: Next): Promise<void> {
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

async function isEligibleCurrentYear(ctx, next): Promise<void> {
    const currentYear = new Date().getFullYear() - 1;
    
    if (ctx.state.user.mcaEligibility.find(e => e.year === currentYear)) {
        return await next();
    }
    
    ctx.body = {
        error: "User wasn't active last year!",
    };
}

function isEligibleFor(user, modeID): boolean {
    const currentYear = new Date().getFullYear() - 1;

    for (const eligibility of user.mcaEligibility) {
        if (eligibility.year === currentYear) {
            let isModeEligible = false;

            switch (modeID) {
                case ModeDivisionType.standard:
                    isModeEligible = user.mcaEligibility.some(e => e.standard && e.year == currentYear);
                    break;

                case ModeDivisionType.mania:
                    isModeEligible = user.mcaEligibility.some(e => e.mania && e.year == currentYear);
                    break;
            
                case ModeDivisionType.taiko:
                    isModeEligible = user.mcaEligibility.some(e => e.taiko && e.year == currentYear);
                    break;
            
                case ModeDivisionType.fruits:
                    isModeEligible = user.mcaEligibility.some(e => e.fruits && e.year == currentYear);
                    break;

                case ModeDivisionType.storyboard:
                    isModeEligible = user.mcaEligibility.some(e => e.storyboard && e.year == currentYear);
                    break;
            }

            if (isModeEligible) {
                return true;
            }
        }
    }
    
    return false;
}

export { isEligible, isNotEligible, isEligibleCurrentYear, isEligibleFor };
