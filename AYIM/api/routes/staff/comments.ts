import Router from "@koa/router";
import { isLoggedInDiscord, isMCAStaff } from "../../../../Server/middleware";
import { UserComment } from "../../../../Models/MCA_AYIM/userComments";
import { currentMCA } from "../../../../MCA-AYIM/api/middleware";
import { MCA } from "../../../../Models/MCA_AYIM/mca";

const commentsReviewRouter = new Router();

commentsReviewRouter.use(isLoggedInDiscord);
commentsReviewRouter.use(isMCAStaff);
commentsReviewRouter.use(currentMCA);

commentsReviewRouter.get("/", async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const filter = ctx.query.filter ?? undefined;
    const skip = ctx.query.skip ? parseInt(ctx.query.skip) : 0;
    let query = UserComment
                    .createQueryBuilder("UserComment")
                    .leftJoin("UserComment.target", "UserComment__target")
                    .leftJoin("UserComment.reviewer", "UserComment__reviewer")
                    .leftJoin("UserComment.commenter", "UserComment__commenter")
                    .leftJoin("UserComment.mode", "UserComment_mode")
                    .select("UserComment.ID", "UserComment_ID")
                    .addSelect("UserComment.comment", "UserComment_comment")
                    .addSelect("UserComment.commenterID", "UserComment_commenterID")
                    .addSelect("UserComment.isValid", "UserComment_isValid")
                    .addSelect("UserComment.lastReviewedAt", "UserComment_lastReviewedAt")
                    .addSelect("UserComment_mode.name", "UserComment_mode_name")
                    .addSelect("UserComment__commenter.osuUserid", "UserComment__commenter_osuUserid")
                    .addSelect("UserComment__commenter.osuUsername", "UserComment__commenter_osuUsername")
                    .addSelect("UserComment__target.osuUserid", "UserComment__target_osuUserid")
                    .addSelect("UserComment__target.osuUsername", "UserComment__target_osuUsername")
                    .addSelect("UserComment__reviewer.osuUsername", "UserComment__reviewer_osuUsername")
                    .where(`year = ${mca.year}`)
    if (filter)
        query.andWhere(`isValid = 0`)
    
    ctx.body = await query.skip(isNaN(skip) ? 0 : skip).take(5).getMany();
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
