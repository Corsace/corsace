import Router from "@koa/router";
import { Beatmapset } from "../../../Models/beatmapset";
import { Influence } from "../../../Models/MCA_AYIM/influence";
import { User } from "../../../Models/user";
import { isLoggedIn } from "../../../Server/middleware";

const influencesRouter = new Router();

influencesRouter.get("/", async (ctx) => {
    const userSearch = ctx.query.user;
    const yearSearch = ctx.query.year;
    if (typeof yearSearch !== "string" || !/^[0-9]{4}$/.test(yearSearch)) {
        ctx.body = {
            error: "Invalid year value.",
        };
        return;
    }
    if (typeof userSearch !== "string") {
        ctx.body = {
            error: "Invalid search query value.",
        };
        return;
    }
    const user = await User
        .createQueryBuilder("user")
        .leftJoin("user.otherNames", "otherName")
        .leftJoinAndSelect("user.influences", "influence", "influence.userID = user.ID")
        .leftJoinAndSelect("influence.influence", "influenceUser")
        .where("user.osuUserid = :userId", { userId: userSearch })
        .orWhere("user.osuUsername LIKE :user")
        .orWhere("otherName.name LIKE :user")
        .andWhere("influence.year <= :year", { year: yearSearch })
        .orderBy("influence.year", "DESC")
        .setParameter("user", `%${userSearch}%`)
        .getOneOrFail();

    ctx.body = user;
});

influencesRouter.post("/influence", isLoggedIn, async (ctx) => {
    const query = ctx.request.body;

    // Check if there are 3 influences already, or if this influence already exists
    const influence = await Influence.createQueryBuilder("influence")
        .leftJoinAndSelect("influence.user", "user", "user.userID = user.ID")
        .leftJoinAndSelect("influence.influence", "influenceUser")
        .where("influence.year = :year", { year: query.year })
        .getMany();
    if (influence.length === 3) {
        ctx.body = { 
            error: "There are 3 influences already!",
        };
        return;
    }
    if (influence.some(inf => inf.influence.osu.userID === query.target || inf.influence.osu.username.toLowerCase() === query.target.toLowerCase())) {
        ctx.body = { 
            error: "There influence already exists!",
        };
        return;
    }

    const target = await User
        .createQueryBuilder("user")
        .leftJoin("user.otherNames", "otherName")
        .where("user.osuUserid = :userId", { userId: query.target })
        .orWhere("user.osuUsername LIKE :user")
        .getOne();
    if (!target) {
        ctx.body = { 
            error: `No user found using the query ${query.target}!`,
        };
        return;
    }

    const newInfluence = new Influence;
    newInfluence.user = ctx.state.user;
    newInfluence.influence = target;
    newInfluence.year = query.year;
    await newInfluence.save();
    ctx.body = {
        newInfluence,
    };
    return;
});

export default influencesRouter;
