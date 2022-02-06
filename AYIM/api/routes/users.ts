import Router from "@koa/router";
import { User } from "../../../Models/user";

const usersRouter = new Router();

usersRouter.get("/search", async (ctx) => {
    const userSearch = ctx.query.user;
    const users = await User
        .createQueryBuilder("user")
        .leftJoin("user.otherNames", "otherName")
        .where("user.osuUserid = :userId", { userId: userSearch })
        .orWhere("user.osuUsername LIKE :user")
        .orWhere("otherName.name LIKE :user")
        .setParameter("user", `%${userSearch}%`)
        .limit(10)
        .getMany();

    ctx.body = users;
});

export default usersRouter;
