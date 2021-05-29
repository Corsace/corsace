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
    const comments = await UserComment.find({
        where: {
            year: mca.year,
            isValid: false,
        },
        relations: ["target", "reviewer", "commenter"],
    });

    ctx.body = comments;
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
