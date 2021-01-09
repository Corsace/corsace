import Router from "koa-router";
import { isLoggedIn } from "../../../CorsaceServer/middleware";
import { User } from "../../../CorsaceModels/user";
import { UserComment } from "../../../CorsaceModels/MCA_AYIM/userComments";
import { ModeDivision, ModeDivisionType } from "../../../CorsaceModels/MCA_AYIM/modeDivision";
import { ParameterizedContext, Next } from "koa";

async function canComment(ctx: ParameterizedContext<any, Router.IRouterParamContext<any, {}>>, next: Next): Promise<any> {
    if (!ctx.state.user.canComment) {
        return ctx.body = {
            error: "You cannot comment",
        };
    }
    
    await next();
}

async function isOwnerComment(ctx: ParameterizedContext<any, Router.IRouterParamContext<any, {}>>, next: Next): Promise<any> {
    const comment = await UserComment.findOneOrFail(ctx.params.id);

    if (comment.commenterID !== ctx.state.user.ID) {
        return ctx.body = {
            error: "Not your comment",
        };
    }

    ctx.state.comment = comment;
    await next();
}

const commentsRouter = new Router();

commentsRouter.get("/", isLoggedIn, canComment, async (ctx) => {
    const [comments, modes] = await Promise.all([
        UserComment.find({
            where: {
                commenter: ctx.state.user,
            },
            relations: ["target"],
        }),
        ModeDivision.find(),
    ]);

    ctx.body = {
        comments,
        modes,
        user: ctx.state.user,
    };
});

commentsRouter.post("/create", isLoggedIn, canComment, async (ctx) => {
    const newComment: string = ctx.request.body.comment.trim();
    const modeInput: string = ctx.request.body.mode;
    const year: number = ctx.request.body.year;
    
    if (!newComment || !modeInput) {
        return ctx.body = {
            error: "Missing data",
        };
    }

    if (ctx.request.body.target == ctx.state.user.ID) {
        return ctx.body = {
            error: `It's yourself`,
        };
    }

    const modeID = parseInt(modeInput, 10);

    if (isNaN(modeID)) {
        return ctx.body = {
            error: "Not a valid mode",
        };
    }

    const [mode, target] = await Promise.all([
        await ModeDivision.findOne(modeID),
        await User.findOne(ctx.request.body.target),
    ]);

    if (!target) {
        return ctx.body = {
            error: "User not found",
        };
    }

    const hasCommented = await UserComment.findOne({
        commenter: ctx.state.user,
        year,
        target,
        mode,
    });

    if (hasCommented) {
        return ctx.body = {
            error: "Already commented on the selected user",
        };
    }
    
    const currentYear = new Date().getFullYear();
    let isModeEligible = false;

    switch (modeID) {
        case ModeDivisionType.standard:
            isModeEligible = target.mcaEligibility.some(e => e.standard && e.year == currentYear);
            break;

        case ModeDivisionType.mania:
            isModeEligible = target.mcaEligibility.some(e => e.mania && e.year == currentYear);
            break;
            
        case ModeDivisionType.taiko:
            isModeEligible = target.mcaEligibility.some(e => e.taiko && e.year == currentYear);
            break;
            
        case ModeDivisionType.fruits:
            isModeEligible = target.mcaEligibility.some(e => e.fruits && e.year == currentYear);
            break;

        case ModeDivisionType.storyboard:
            isModeEligible = target.mcaEligibility.some(e => e.storyboard && e.year == currentYear);
            break;
    }

    if (!isModeEligible) {
        return ctx.body = {
            error: `User wasn't active for the selected mode`,
        };
    }

    const comment = new UserComment();
    comment.mode = mode as ModeDivision;
    comment.comment = newComment;
    comment.commenter = ctx.state.user;
    comment.target = target;
    comment.isValid = false;
    await comment.save();

    ctx.body = comment;
});

commentsRouter.post("/:id/update", isLoggedIn, canComment, isOwnerComment, async (ctx) => {
    const newComment: string = ctx.request.body.comment.trim();

    if (!newComment) {
        return ctx.body = {
            error: "Add a comment",
        };
    }

    const comment: UserComment = ctx.state.comment;
    comment.comment = newComment;
    await comment.save();

    ctx.body = comment;
});

commentsRouter.post("/:id/remove", isLoggedIn, canComment, isOwnerComment, async (ctx) => {
    await ctx.state.comment.remove();

    ctx.body = {
        success: "ok",
    };
});

export default commentsRouter;
