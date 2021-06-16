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
                    .createQueryBuilder("userComment")
                    .innerJoin("userComment.target", "target")
                    .innerJoin("userComment.reviewer", "reviewer")
                    .innerJoin("userComment.commenter", "commenter")
                    .innerJoin("userComment.mode", "mode")
                    .select([
                        "userComment.ID", 
                        "userComment.comment", 
                        "userComment.isValid",
                        "userComment.lastReviewedAt",
                        "mode.name",
                        "commenter.osuUserid",
                        "commenter.osuUsername",
                        "target.osuUserid",
                        "target.osuUsername",
                        "reviewer.osuUsername"
                    ])
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
