import Router from "@koa/router";
import {isHeadStaff, isLoggedInDiscord } from "../../../../Server/middleware";
import { User } from "../../../../Models/user";
import { UserComment } from "../../../../Models/MCA_AYIM/userComments";

const usersRouter = new Router();

usersRouter.use(isLoggedInDiscord);
usersRouter.use(isHeadStaff);

usersRouter.post("/:id/ban", async (ctx) => {
    const user = await User.findOneOrFail({
        where: { ID: parseInt(ctx.params.id, 10) },
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

usersRouter.get("/:id/unban", async (ctx) => {
    const user = await User.findOneOrFail({ where: { ID: parseInt(ctx.params.id, 10) }});
    user.canComment = true;
    await user.save();

    ctx.body = {
        success: "ok",
    };
});

export default usersRouter;
