import Router from "@koa/router";
import { isLoggedInDiscord, isMCAStaff } from "../../../../Server/middleware";
import { UserComment } from "../../../../Models/MCA_AYIM/userComments";
import { validatePhaseYear } from "../../../../MCA-AYIM/api/middleware";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { StaffComment } from "../../../../Interfaces/comment";
import { Brackets } from "typeorm";
import { parseQueryParam } from "../../../../Server/utils/query";

const commentsReviewRouter = new Router();

commentsReviewRouter.use(isLoggedInDiscord);
commentsReviewRouter.use(isMCAStaff);

commentsReviewRouter.get("/:year", validatePhaseYear, async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const filter = ctx.query.filter ?? undefined;
    const skip = ctx.query.skip ? parseInt(parseQueryParam(ctx.query.skip) || "") : 0;
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
    
    const comments = await query.offset(isNaN(skip) ? 0 : skip).limit(10).getRawMany();
    const staffComments = comments.map(comment => {
        const keys = Object.keys(comment);
        const staffComment: StaffComment = {
            ID: comment.ID,
            comment: comment.comment,
            isValid: comment.isValid === 1,
            mode: comment.modeName,
            commenter: {
                ID: 0,
                osuID: "",
                osuUsername: "",
            },
            target: {
                osuID: "",
                osuUsername: "",
            },
            lastReviewedAt: comment.lastReviewedAt ?? undefined,
            reviewer: comment.reviewer ?? undefined,
        };
        for (const key of keys) {
            if (key.includes("commenter"))
                staffComment.commenter[key.replace("commenter", "")] = comment[key];
            else if (key.includes("target"))
                staffComment.target[key.replace("target", "")] = comment[key];
        }

        return staffComment;
    });
    ctx.body = staffComments;
});

commentsReviewRouter.post("/:id/review", async (ctx) => {
    const comment = await UserComment.findOneOrFail(ctx.params.id);
    comment.comment = ctx.request.body.comment.trim();
    comment.isValid = true;
    comment.reviewer = ctx.state.user;
    comment.lastReviewedAt = new Date();
    await comment.save();

    ctx.body = comment;
});

commentsReviewRouter.post("/:id/remove", async (ctx) => {
    const comment = await UserComment.findOneOrFail(ctx.params.id);
    await comment.remove();

    ctx.body = {
        success: "ok",
    };
});

export default commentsReviewRouter;
