import Router from "koa-router";
import { isLoggedIn, hasRole, isLoggedInDiscord } from "../../../../CorsaceServer/middleware";
import { UserComment } from "../../../../CorsaceModels/MCA_AYIM/userComments";

const commentsReviewRouter = new Router();

commentsReviewRouter.get("/:year", isLoggedIn, isLoggedInDiscord, hasRole("mca", "staff"), async (ctx) => {
    const comments = await UserComment.find({
        relations: ["target", "reviewer", "commenter"],
        where: {
            year: ctx.params.year,
        },
    });

    ctx.body = {
        comments,
        user: ctx.state.user,
    };
});

commentsReviewRouter.post("/:id/review", isLoggedIn, isLoggedInDiscord, hasRole("mca", "staff"), async (ctx) => {
    const comment = await UserComment.findOneOrFail(ctx.params.id);
    comment.comment = ctx.request.body.comment.trim();
    comment.isValid = ctx.request.body.isValid;
    comment.reviewer = ctx.state.user;
    comment.lastReviewedAt = new Date();
    await comment.save();

    ctx.body = comment;
});

commentsReviewRouter.post("/:id/remove", isLoggedIn, isLoggedInDiscord, hasRole("mca", "staff"), async (ctx) => {
    const comment = await UserComment.findOneOrFail(ctx.params.id);
    await comment.remove();

    ctx.body = {
        success: "ok",
    };
});

export default commentsReviewRouter;
