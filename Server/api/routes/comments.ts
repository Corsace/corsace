import Router from "@koa/router";
import { ParameterizedContext, Next, UserAuthenticatedState, CommentAuthenticatedState } from "koa";
import { User } from "../../../Models/user";
import { UserComment } from "../../../Models/MCA_AYIM/userComments";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { isEligibleFor } from "../../middleware/mca-ayim";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { FindOptionsWhere } from "typeorm";
import { isLoggedIn } from "../../middleware";
import { parseQueryParam } from "../../utils/query";
import { profanityFilter } from "../../../Interfaces/comment";
import { ModeDivisionType } from "../../../Interfaces/modes";

// These 2 middleware functions (canComment and isCommentOwner) MUST be used after isLoggedIn or isLoggedInDiscord
async function canComment (ctx: ParameterizedContext<UserAuthenticatedState>, next: Next): Promise<any> {
    if (!ctx.state.user.canComment) {
        return ctx.body = {
            success: false,
            error: "You cannot comment",
        };
    }
    
    await next();
}

async function isCommentOwner (ctx: ParameterizedContext<UserAuthenticatedState>, next: Next): Promise<any> {
    const comment = await UserComment.findOneOrFail({ 
        where: {
            ID: ctx.params.id,
        },
        relations: ["commenter"],
    });

    if (comment.commenterID !== ctx.state.user.ID) {
        return ctx.body = {
            error: "Not your comment",
        };
    }

    ctx.state.comment = comment;
    await next();
}

const commentsRouter = new Router();

commentsRouter.get("/", async (ctx) => {
    if (!ctx.query.user) {
        ctx.body = {
            success: false,
            error: "No user ID provided!",
        };
        return;
    }

    const modeString: string = parseQueryParam(ctx.query.mode) ?? "standard";
    if (!(modeString in ModeDivisionType)) {
        ctx.body = {
            success: false,
            error: "Invalid mode, please use standard, taiko, fruits or mania",
        };
        return;
    }
    const modeID = ModeDivisionType[modeString as keyof typeof ModeDivisionType];
    const userId = parseInt(parseQueryParam(ctx.query.user) ?? "");
    const year = parseInt(parseQueryParam(ctx.query.year) ?? "") ?? new Date().getUTCFullYear();

    if (year >= 2020) {
        ctx.body = {
            success: false,
            error: `MCA ${year} is not running comments for AYIM. Sorry for the inconvenience.`,
        };
        return;
    }

    const mca = await MCA.findOneOrFail({
        where: { year },
    });

    const baseQuery: FindOptionsWhere<UserComment> = {
        targetID: userId,
        year: year,
        mode: { ID: modeID },
        commenter: ctx.state.user ? { ID: ctx.state.user.ID } : undefined,
    };

    let query: FindOptionsWhere<UserComment> | FindOptionsWhere<UserComment>[] = baseQuery;

    // Show all comments if mca results are out
    if (new Date() >= mca?.results) {
        query = [
            baseQuery,
            {
                targetID: userId,
                year: year,
                mode: { ID: modeID },
                isValid: true,
            },
        ];
    }

    const [target, comments] = await Promise.all([
        User.findOneOrFail({
            where: {
                ID: userId,
            },
        }),

        UserComment.find({
            where: query,
            relations: ["commenter"],
            order: {
                updatedAt: "DESC",
            },
        }),
    ]);

    if (!isEligibleFor(target, modeID, year)) {
        ctx.body = {
            success: false,
            error: `User wasn't active for the selected mode`,
        };
        return;
    }

    ctx.body = {
        success: true,
        user: target,
        comments,
    };
});

commentsRouter.post<UserAuthenticatedState>("/create", isLoggedIn, canComment, async (ctx) => {
    const newComment: string = ctx.request.body.comment.trim();
    const year: number = ctx.request.body.year;
    const targetID: number = ctx.request.body.targetID;
    const modeInput: string = ctx.request.body.mode;
    if (!(modeInput in ModeDivisionType)) {
        ctx.body = {
            success: false,
            error: "Invalid mode, please use standard, taiko, fruits or mania",
        };
        return;
    }
    const modeID = ModeDivisionType[modeInput as keyof typeof ModeDivisionType];
    const commenter: User = ctx.state.user;
    
    if (!newComment || !modeInput || !year || !targetID) {
        return ctx.body = {
            success: false,
            error: "Missing data",
        };
    }

    if (year >= 2020) {
        ctx.body = {
            success: false,
            error: `MCA ${year} is not running comments for AYIM. Sorry for the inconvenience.`,
        };
        return;
    }

    const mca = await MCA.findOneOrFail({
        where: { year },
    });

    if (mca.currentPhase() === "results") {
        return ctx.body = {
            success: false,
            error: "You can only create before MCA results are out!",
        };
    }

    if (targetID == ctx.state.user.ID) {
        return ctx.body = {
            success: false,
            error: `It's yourself`,
        };
    }

    const [mode, target] = await Promise.all([
        ModeDivision.findOneOrFail({
            where: {
                ID: modeID,
            },
        }),
        User.findOneOrFail({
            where: {
                ID: targetID,
            },
        }),
    ]);

    const hasCommented = await UserComment.findOne({
        where: {
            commenter: {
                ID: commenter.ID,
            },
            year,
            target: {
                ID: target.ID,
            },
            mode: {
                ID: mode.ID,
            },
        },
    });

    if (hasCommented) {
        return ctx.body = {
            success: false,
            error: "Already commented on the selected user this year and mode",
        };
    }

    if (!isEligibleFor(target, modeID, year)) {
        return ctx.body = {
            success: false,
            error: `User wasn't active for the selected mode`,
        };
    }

    if (profanityFilter.test(newComment)) {
        return ctx.body = {
            success: false,
            error: "Comment is TERRIBLE .",
        };
    }

    const comment = new UserComment();
    comment.year = year;
    comment.mode = mode;
    comment.comment = newComment;
    comment.commenter = commenter;
    comment.target = target;
    comment.isValid = false;
    await comment.save();

    ctx.body = {
        success: true,
        comment,
    };
});

commentsRouter.post<CommentAuthenticatedState>("/:id/update", isLoggedIn, canComment, isCommentOwner, async (ctx) => {
    const newComment: string = ctx.request.body.comment.trim();

    if (!newComment) {
        return ctx.body = {
            error: "Add a comment",
        };
    }

    const comment: UserComment = ctx.state.comment;
    const mca = await MCA.findOneOrFail({
        where: { year: comment.year },
    });

    if (mca.currentPhase() === "results") {
        return ctx.body = {
            error: "Can only remove before MCA results",
        };
    }

    comment.comment = newComment;
    comment.isValid = false;
    comment.reviewer = comment.lastReviewedAt = undefined;
    await comment.save();

    ctx.body = comment;
});

commentsRouter.post<CommentAuthenticatedState>("/:id/remove", isLoggedIn, canComment, isCommentOwner, async (ctx) => {
    const comment: UserComment = ctx.state.comment;
    const mca = await MCA.findOneOrFail({
        where: { year: comment.year },
    });

    if (mca.currentPhase() === "results") {
        return ctx.body = {
            error: "Can only remove before MCA results",
        };
    }

    await ctx.state.comment.remove();

    ctx.body = {
        success: "ok",
    };
});

export default commentsRouter;
