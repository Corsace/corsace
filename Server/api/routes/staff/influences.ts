import { CorsaceRouter } from "../../../corsaceRouter";
import { Influence } from "../../../../Models/MCA_AYIM/influence";
import { isLoggedInDiscord } from "../../../../Server/middleware";
import { Brackets } from "typeorm";
import { parseQueryParam } from "../../../../Server/utils/query";
import { StaffComment } from "../../../../Interfaces/comment";
import { isMCAStaff } from "../../../middleware/mca-ayim";
import { UserAuthenticatedState } from "koa";

const influencesReviewRouter  = new CorsaceRouter<UserAuthenticatedState>();

influencesReviewRouter.$use(isLoggedInDiscord);
influencesReviewRouter.$use(isMCAStaff);

influencesReviewRouter.$get<{ staffComments: StaffComment[] }>("/", async (ctx) => {
    const filter = ctx.query.filter ?? undefined;
    const skip = ctx.query.skip ? parseInt(parseQueryParam(ctx.query.skip) ?? "") : 0;
    const year = ctx.query.year ? parseInt(parseQueryParam(ctx.query.year) ?? "") : undefined;
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
        const staffComment: StaffComment = {
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
        };

        return staffComment;
    });
    ctx.body = {
        success: true,
        staffComments,
    };
});

influencesReviewRouter.$post<{
    isValid: true;
    reviewer: string;
    lastReviewedAt: Date;
}>("/:id/review", async (ctx) => {
    const influence = await Influence.findOneOrFail({ where: { ID: parseInt(ctx.params.id, 10) }});
    influence.comment = ctx.request.body.comment.trim();
    influence.isValid = true;
    influence.reviewer = ctx.state.user;
    influence.lastReviewedAt = new Date();
    await influence.save();

    ctx.body = {
        success: true,
        isValid: true,
        reviewer: ctx.state.user.osu.username,
        lastReviewedAt: influence.lastReviewedAt,
    };
});

influencesReviewRouter.$post("/:id/remove", async (ctx) => {
    const influence = await Influence.findOneOrFail({ where: { ID: parseInt(ctx.params.id, 10) }});
    influence.comment = "";
    await influence.save();

    ctx.body = {
        success: true,
    };
});

export default influencesReviewRouter;