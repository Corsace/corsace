import Router from "@koa/router";
import { Influence } from "../../../../Models/MCA_AYIM/influence";
import { isLoggedInDiscord, isMCAStaff } from "../../../../Server/middleware";
import { Brackets } from "typeorm";
import { parseQueryParam } from "../../../../Server/utils/query";
import { StaffComment } from "../../../../Interfaces/comment";

const influencesReviewRouter = new Router();

influencesReviewRouter.use(isLoggedInDiscord);
influencesReviewRouter.use(isMCAStaff);

influencesReviewRouter.get("/", async (ctx) => {
    const filter = ctx.query.filter ?? undefined;
    const skip = ctx.query.skip ? parseInt(parseQueryParam(ctx.query.skip) || "") : 0;
    const year = ctx.query.year ? parseInt(parseQueryParam(ctx.query.year) || "") : undefined;
    const text = ctx.query.text ?? undefined;
    const query = Influence
        .createQueryBuilder("influence")
        .innerJoin("influence.user", "user")
        .innerJoin("influence.influence", "influenceUser")
        .innerJoin("influence.mode", "mode")
        .leftJoin("influence.reviewer", "reviewer")
        .select("influence.ID", "ID")
        .addSelect("influence.comment", "comment")
        .addSelect("user.ID", "commenterID")
        .addSelect("influence.isValid", "isValid")
        .addSelect("influence.lastReviewedAt", "lastReviewedAt")
        .addSelect("mode.name", "modeName")
        .addSelect("user.osuUserid", "commenterosuID")
        .addSelect("user.osuUsername", "commenterosuUsername")
        .addSelect("influenceUser.osuUserid", "targetosuID")
        .addSelect("influenceUser.osuUsername", "targetosuUsername")
        .addSelect("reviewer.osuUsername", "reviewer")
        .where("influence.comment IS NOT NULL")
        .andWhere("influence.comment <> ''");
    if (filter)
        query.andWhere(`isValid = 0`);
    if (text) {
        query
            .andWhere(new Brackets(qb => {
                qb.where("user.osuUsername LIKE :criteria")
                    .orWhere("user.osuUserid LIKE :criteria")
                    .orWhere("influenceUser.osuUsername LIKE :criteria")
                    .orWhere("influenceUser.osuUserid LIKE :criteria");
            }))
            .setParameter("criteria", `%${text}%`);
    }
    if (year && !isNaN(year))
        query.andWhere(`year = ${year}`);
    
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

influencesReviewRouter.post("/:id/review", async (ctx) => {
    const influence = await Influence.findOneOrFail(ctx.params.id);
    influence.comment = ctx.request.body.comment.trim();
    influence.isValid = true;
    influence.reviewer = ctx.state.user;
    influence.lastReviewedAt = new Date();
    await influence.save();

    ctx.body = influence;
});

influencesReviewRouter.post("/:id/remove", async (ctx) => {
    const influence = await Influence.findOneOrFail(ctx.params.id);
    influence.comment = "";
    await influence.save();

    ctx.body = {
        success: "ok",
    };
});

export default influencesReviewRouter;