import { CorsaceRouter } from "../../corsaceRouter";
import { Brackets, MoreThan } from "typeorm";
import { currentMCA, isEligibleFor } from "../../../Server/middleware/mca-ayim";
import { Influence } from "../../../Models/MCA_AYIM/influence";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { User } from "../../../Models/user";
import { isLoggedIn } from "../../../Server/middleware";
import { MCAAuthenticatedState, UserAuthenticatedState } from "koa";
import { parseQueryParam } from "../../utils/query";
import { ModeDivisionType } from "../../../Interfaces/modes";
import { UserInfo } from "../../../Interfaces/user";

const influencesRouter  = new CorsaceRouter();

influencesRouter.$get<{
    user: UserInfo;
    influences: Influence[]
}>("/", async (ctx) => {
    const userSearch = ctx.query.user;
    const yearSearch = ctx.query.year;
    
    const modeQ = parseQueryParam(ctx.query.mode);
    if (!modeQ) {
        return ctx.body = {
            success: false,
            error: "Missing mode",
        };
    }
    if (!(modeQ in ModeDivisionType)) {
        return ctx.body = {
            success: false,
            error: "Invalid mode, please use standard, taiko, fruits or mania",
        };
    }

    const mode = ModeDivisionType[modeQ as keyof typeof ModeDivisionType];

    if (typeof yearSearch !== "string" || !/^20[0-9]{2}$/.test(yearSearch)) {
        ctx.body = {
            success: false,
            error: "Invalid year value.",
        };
        return;
    }
    if (typeof userSearch !== "string") {
        ctx.body = {
            success: false,
            error: "Invalid search query value.",
        };
        return;
    }
    
    const user = await User
        .createQueryBuilder("user")
        .leftJoin("user.otherNames", "otherName")
        .leftJoinAndSelect("user.influences", "influence", "influence.userID = user.ID")
        .leftJoinAndSelect("influence.influence", "influenceUser")
        .where(new Brackets(qb => {
            qb.orWhere("user.osuUserid = :userId", { userId: userSearch })
                .orWhere("user.osuUsername LIKE :user")
                .orWhere("otherName.name LIKE :user");
        }))
        .andWhere("influence.year <= :year", { year: yearSearch })
        .andWhere("influence.modeID = :mode", { mode })
        .orderBy("influence.year", "DESC")
        .setParameter("user", `%${userSearch}%`)
        .getOneOrFail();

    const latestRecordedYear = Math.max(...user.influences.map(i => i.year));
    user.influences = user.influences.filter(i => i.year === latestRecordedYear);

    ctx.body = {
        success: true,
        user: await user.getInfo(),
        influences: user.influences,
    };
});

influencesRouter.$post<{ newInfluence: Influence }, UserAuthenticatedState>("/create", isLoggedIn, async (ctx) => {
    const query = ctx.request.body;

    if (!query.year || !/^20[0-9]{2}$/.test(query.year)) {
        ctx.body = {
            success: false,
            error: "A year is not provided!",
        };
        return;
    }
    query.year = parseInt(query.year, 10);
    if (!query.target || !/^\d+$/.test(query.target)) {
        ctx.body = { 
            success: false,
            error: "Missing corsace ID!",
        };
        return;
    }
    query.target = parseInt(query.target, 10);

    if (!query.mode) {
        ctx.body = {
            success: false,
            error: "Missing mode!",
        };
        return;
    }
    query.mode = parseInt(query.mode, 10);
    if (isNaN(query.mode)) {
        query.mode = ModeDivisionType[query.mode];
    }
    const modeDivision = await ModeDivision.findOne({ where: { ID: query.mode }});
    if (!modeDivision) {
        ctx.body = { 
            success: false,
            error: "Could not find the appropriate mode!",
        };
        return;
    }
    
    if (!isEligibleFor(ctx.state.user, modeDivision.ID, query.year)) {
        ctx.body = { 
            success: false,
            error: "You did not rank a set or guest difficulty this year!",
        };
        return;
    }

    // Check if there are 5 influences already, or if this influence already exists, or if the year is in the future
    const influences = await Influence.find({
        where: {
            user: { ID: ctx.state.user.ID },
            year: query.year,
            mode: {
                ID: modeDivision.ID,
            },
        },
        relations: ["influence"],
    });
    if (influences.length === 5) {
        ctx.body = { 
            success: false,
            error: "There are 5 influences already!",
        };
        return;
    }
    if (influences.some(inf => inf.influence.ID === query.target)) {
        ctx.body = { 
            success: false,
            error: "This influence already exists!",
        };
        return;
    }
    if (query.year > (new Date()).getUTCFullYear()) {
        ctx.body = { 
            success: false,
            error: "You cannot provide influences for future years!",
        };
        return;
    }
    const target = await User.findOne({ where: { ID: query.target }});
    if (!target) {
        ctx.body = { 
            success: false,
            error: `No user with corsace ID ${query.target} found!`,
        };
        return;
    }

    const newInfluence = new Influence();
    newInfluence.user = ctx.state.user;
    newInfluence.influence = target;
    newInfluence.year = query.year;
    newInfluence.comment = ctx.state.user.canComment ? query.comment : "";
    newInfluence.rank = influences.length + 1;
    newInfluence.mode = modeDivision;
    await newInfluence.save();
    return ctx.body = {
        success: true,
        newInfluence,
    };
});

influencesRouter.$delete<object, MCAAuthenticatedState>("/:id", isLoggedIn, currentMCA, async (ctx) => {
    const id = ctx.params.id;
    if (!/^\d+$/.test(id)) {
        ctx.body = { 
            success: false,
            error: "An influence ID is not provided!",
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
            success: false,
            error: "Invalid influence ID!",
        };
        return;
    }
    const mca = ctx.state.mca;
    if (influence.year < mca.year) {
        ctx.body = {
            success: false,
            error: "You cannot remove influences for previous years!",
        };
        return;
    }

    await influence.remove();

    const influences = await Influence.find({
        where: {
            user: {
                ID: ctx.state.user.ID,
            },
            year: mca.year,
            rank: MoreThan(influence.rank),
            mode: {
                ID: influence.mode.ID,
            },
        },
    });

    await Promise.all(
        influences.map(i => {
            i.rank--;
            return i.save();
        })
    );
    ctx.body = {
        success: true,
    };
    return;
});

export default influencesRouter;
