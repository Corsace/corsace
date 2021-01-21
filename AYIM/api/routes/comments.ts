import Router from "@koa/router";
import { ParameterizedContext, Next } from "koa";
import { isLoggedInOsu } from "../../../Server/middleware";
import { User } from "../../../Models/user";
import { UserComment } from "../../../Models/MCA_AYIM/userComments";
import { ModeDivision, ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";
import { isEligibleFor } from "../../../MCA/api/middleware";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { FindConditions } from "typeorm";

async function canComment (ctx: ParameterizedContext, next: Next): Promise<any> {
    if (!ctx.state.user.canComment) {
        return ctx.body = {
            error: "You cannot comment",
        };
    }
    
    await next();
}

async function isCommentOwner (ctx: ParameterizedContext, next: Next): Promise<any> {
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
    const userId = parseInt(ctx.query.user);
    const year = parseInt(ctx.query.year || new Date().getFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const mca = await MCA.findOneOrFail({
        year,
    });

    let query: FindConditions<UserComment> | FindConditions<UserComment>[] = {
        targetID: userId,
        year: year,
        mode: modeId,
        commenter: ctx.state.user,
    };

    // Show all comments if mca results are out
    if (new Date() >= mca?.results) {
        query = [
            query,
            {
                targetID: userId,
                year: year,
                mode: modeId,
                isValid: true,
            },
        ];
    }

    const [user, comments] = await Promise.all([
        User.findOneOrFail(userId),

        UserComment.find({
            where: query,
            relations: ["commenter"],
            order: {
                updatedAt: "DESC",
            },
        }),
    ]);

    ctx.body = {
        user,
        comments,
    };
});

commentsRouter.post("/create", isLoggedInOsu, canComment, async (ctx) => {
    const newComment: string = ctx.request.body.comment.trim();
    const year: number = ctx.request.body.year;
    const targetID: number = ctx.request.body.targetID;
    const modeInput: string = ctx.request.body.mode;
    const modeID = ModeDivisionType[modeInput];
    const commenter: User = ctx.state.user;
    
    if (!newComment || !modeInput || !year || !targetID) {
        return ctx.body = {
            error: "Missing data",
        };
    }

    const mca = await MCA.findOneOrFail({
        year,
    });

    if (!mca.isNominationPhase()) {
        return ctx.body = {
            error: "Can only create during MCA nomination phase",
        };
    }

    if (targetID == ctx.state.user.ID) {
        return ctx.body = {
            error: `It's yourself`,
        };
    }

    const [mode, target] = await Promise.all([
        ModeDivision.findOneOrFail(modeID),
        User.findOneOrFail(targetID),
    ]);

    const hasCommented = await UserComment.findOne({
        commenter,
        year,
        target,
        mode,
    });

    if (hasCommented) {
        return ctx.body = {
            error: "Already commented on the selected user this year and mode",
        };
    }

    if (!isEligibleFor(target, modeID, year)) {
        return ctx.body = {
            error: `User wasn't active for the selected mode`,
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

    ctx.body = comment;
});

commentsRouter.post("/:id/update", isLoggedInOsu, canComment, isCommentOwner, async (ctx) => {
    const newComment: string = ctx.request.body.comment.trim();

    if (!newComment) {
        return ctx.body = {
            error: "Add a comment",
        };
    }

    const comment: UserComment = ctx.state.comment;
    const mca = await MCA.findOneOrFail({
        year: comment.year,
    });

    if (!mca.isNominationPhase()) {
        return ctx.body = {
            error: "Can only update during MCA nomination phase",
        };
    }

    comment.comment = newComment;
    comment.isValid = false;
    await comment.save();

    ctx.body = comment;
});

commentsRouter.post("/:id/remove", isLoggedInOsu, canComment, isCommentOwner, async (ctx) => {
    const comment: UserComment = ctx.state.comment;
    const mca = await MCA.findOneOrFail({
        year: comment.year,
    });

    if (new Date() >= mca?.results) {
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
