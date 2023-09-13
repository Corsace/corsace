import Router from "@koa/router";
import { isLoggedInDiscord } from "../../../middleware";
import { User } from "../../../../Models/user";
import { UserComment } from "../../../../Models/MCA_AYIM/userComments";
import { isMCAStaff, validatePhaseYear } from "../../../middleware/mca-ayim";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { StaffComment } from "../../../../Interfaces/comment";
import { Brackets } from "typeorm";
import { parseQueryParam } from "../../../utils/query";

const commentsReviewRouter = new Router();

commentsReviewRouter.use(isLoggedInDiscord);
commentsReviewRouter.use(isMCAStaff);

commentsReviewRouter.get("/:year", validatePhaseYear, async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const filter = ctx.query.filter ?? undefined;
    const skip = ctx.query.skip ? parseInt(parseQueryParam(ctx.query.skip) ?? "") : 0;
    const text = ctx.query.text ?? undefined;
    const query = UserComment
        .createQueryBuilder("userComment")
        .innerJoin("userComment.commenter", "commenter")
        .innerJoin("userComment.target", "target")
        .innerJoin("userComment.mode", "mode")
        .leftJoin("userComment.reviewer", "reviewer")
        .select("userComment.ID", "ID")
        .addSelect("userComment.comment", "comment")
        .addSelect("userComment.commenterID", "commenterID")
        .addSelect("userComment.isValid", "isValid")
        .addSelect("userComment.lastReviewedAt", "lastReviewedAt")
        .addSelect("mode.name", "modeName")
        .addSelect("commenter.osuUserid", "commenterosuID")
        .addSelect("commenter.osuUsername", "commenterosuUsername")
        .addSelect("target.osuUserid", "targetosuID")
        .addSelect("target.osuUsername", "targetosuUsername")
        .addSelect("reviewer.osuUsername", "reviewer")
        .where(`year = ${mca.year}`);
    if (filter)
        query.andWhere(`isValid = 0`);
    if (text) {
        query
            .andWhere(new Brackets(qb => {
                qb.where("commenter.osuUsername LIKE :criteria")
                    .orWhere("commenter.osuUserid LIKE :criteria")
                    .orWhere("target.osuUsername LIKE :criteria")
                    .orWhere("target.osuUserid LIKE :criteria");
            }))
            .setParameter("criteria", `%${text}%`);
    }
    
    const comments: {
        ID: number;
        comment: string;
        commenterID: number;
        isValid: number;
        lastReviewedAt: Date;
        modeName: string;
        commenterosuID: string;
        commenterosuUsername: string;
        targetosuID: string;
        targetosuUsername: string;
        reviewer: string;
    }[] = await query.offset(isNaN(skip) ? 0 : skip).limit(10).getRawMany();
    const staffComments = comments.map<StaffComment>(comment => ({
        ID: comment.ID,
        comment: comment.comment,
        isValid: comment.isValid === 1,
        mode: comment.modeName,
        commenter: {
            ID: comment.commenterID,
            osuID: comment.commenterosuID,
            osuUsername: comment.commenterosuUsername,
        },
        target: {
            osuID: comment.targetosuID,
            osuUsername: comment.targetosuUsername,
        },
        lastReviewedAt: comment.lastReviewedAt ?? undefined,
        reviewer: comment.reviewer ?? undefined,
    }));
    ctx.body = staffComments;
});

commentsReviewRouter.post("/:id/review", async (ctx) => {
    const comment = await UserComment.findOneOrFail({ where: { ID: parseInt(ctx.params.id, 10) }});
    comment.comment = ctx.request.body.comment.trim();
    comment.isValid = true;
    comment.reviewer = ctx.state.user;
    comment.lastReviewedAt = new Date();
    await comment.save();

    ctx.body = comment;
});

commentsReviewRouter.post("/:id/remove", async (ctx) => {
    const comment = await UserComment.findOneOrFail({ where: { ID: parseInt(ctx.params.id, 10) }});
    await comment.remove();

    ctx.body = {
        success: "ok",
    };
});

commentsReviewRouter.post("/:id/ban", async (ctx) => {
    const ID = parseInt(ctx.params.id, 10);
    if (!ID) {
        ctx.body = {
            error: "Invalid ID provided.",
        };
        return;
    }

    const user = await User.findOneOrFail({
        where: {
            ID,
        },
        relations: ["commentsMade"],
    });
    const invalidComments = user.commentsMade.filter(c => !c.isValid);
    user.canComment = false;

    await Promise.all([
        UserComment.remove(invalidComments),
        user.save(),
    ]);

    ctx.body = {
        success: "ok",
    };
});

commentsReviewRouter.post("/:id/unban", async (ctx) => {
    const ID = parseInt(ctx.params.id, 10);
    if (!ID) {
        ctx.body = {
            error: "Invalid ID provided.",
        };
        return;
    }

    const user = await User.findOneOrFail({
        where: {
            ID,
        },
    });
    user.canComment = true;
    await user.save();

    ctx.body = {
        success: "ok",
    };
});

export default commentsReviewRouter;
