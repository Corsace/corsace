import Router from "@koa/router";
import { User } from "../../../Models/user";

const influencesRouter = new Router();

influencesRouter.get("/", async (ctx) => {
    const userSearch = ctx.query.user;
    const yearSearch = ctx.query.year;
    console.log(yearSearch);
    const user = await User
        .createQueryBuilder("user")
        .leftJoin("user.otherNames", "otherName")
        .leftJoinAndSelect("user.influences", "influence", "influence.userID = user.ID")
        .leftJoinAndSelect("influence.influence", "influenceUser")
        .where("user.osuUserid = :userId", { userId: userSearch })
        .orWhere("user.osuUsername LIKE :user")
        .orWhere("otherName.name LIKE :user")
        .andWhere("influence.year = :year", { year: yearSearch })
        .setParameter("user", `%${userSearch}%`)
        .getOneOrFail();

    ctx.body = user;
});

export default influencesRouter;
