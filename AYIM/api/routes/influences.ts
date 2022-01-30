import Router from "@koa/router";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { currentMCA } from "../../../MCA-AYIM/api/middleware";
import { Influence } from "../../../Models/MCA_AYIM/influence";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { User } from "../../../Models/user";
import { isLoggedIn } from "../../../Server/middleware";

const influencesRouter = new Router();

influencesRouter.get("/", async (ctx) => {
    const userSearch = ctx.query.user;
    const yearSearch = ctx.query.year;
    if (typeof yearSearch !== "string" || !/^20[0-9]{2}$/.test(yearSearch)) {
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

influencesRouter.post("/create", isLoggedIn, async (ctx) => {
    const query = ctx.request.body;

    if (!query.year || !/^20[0-9]{2}$/.test(query.year)) {
        ctx.body = { 
            error: "A year is not provided!",
        };
        return;
    }
    if (!query.target || !/^\d+$/.test(query.target)) {
        ctx.body = { 
            error: "Missing corsace ID!",
        };
        return;
    }

    // Check if there are 3 influences already, or if this influence already exists, or if the year is in the future
    const influence = await Influence.createQueryBuilder("influence")
        .leftJoinAndSelect("influence.user", "user", "influence.userID = user.ID")
        .leftJoinAndSelect("influence.influence", "influenceUser")
        .where("influence.year = :year", { year: query.year })
        .getMany();
    if (influence.length === 5) {
        ctx.body = { 
            error: "There are 5 influences already!",
        };
        return;
    }
    query.target = parseInt(query.target, 10);
    if (influence.some(inf => inf.influence.ID === query.target)) {
        ctx.body = { 
            error: "This influence already exists!",
        };
        return;
    }
    query.year = parseInt(query.year, 10);
    if (query.year > (new Date).getUTCFullYear()) {
        ctx.body = { 
            error: "You cannot provide influences for future years!",
        };
        return;
    }

    const target = await User
        .createQueryBuilder("user")
        .leftJoin("user.otherNames", "otherName")
        .where("user.ID = :userId", { userId: query.target })
        .getOne();
    if (!target) {
        ctx.body = { 
            error: `No user with corsace ID ${query.target} found!`,
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

influencesRouter.delete("/:id", isLoggedIn, currentMCA, async (ctx) => {
    const id = ctx.params.id;
    if (!/^\d+$/.test(id)) {
        ctx.body = { 
            error: "An influnce ID is not provided!",
        };
        return;
    }

    const influence = await Influence.createQueryBuilder("influence")
        .leftJoinAndSelect("influence.user", "user", "influence.userID = user.ID")
        .leftJoinAndSelect("influence.influence", "influenceUser")
        .where("influence.ID = :id", { id })
        .andWhere("user.ID = :userID", { userID: ctx.state.user.ID })
        .getOne();
    if (!influence) {
        ctx.body = { 
            error: "Invalid influence ID!",
        };
        return;
    }
    const mca = await MCA.findOne({
        results: MoreThanOrEqual(new Date()),
        nomination: {
            start: LessThanOrEqual(new Date()),
        },
    });
    if (influence.year < (mca ? mca.year : (new Date()).getUTCFullYear())) {
        ctx.body = { 
            error: "You cannot remove influences for previous years!",
        };
        return;
    }

    await influence.remove();
    ctx.body = {
        success: "removed",
    };
    return;
});

export default influencesRouter;
