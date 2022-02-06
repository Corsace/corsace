import "reflect-metadata";
import { config } from "node-config-ts";
import { createConnection } from "typeorm";
import Koa from "koa";
import koaCash from "koa-cash";
import BodyParser from "koa-bodyparser";
import Mount from "koa-mount";
import passport from "koa-passport";
import Session from "koa-session";
import { cache } from "./cache";
import { setupPassport } from "./passportFunctions";

import logoutRouter from "./api/routes/login/logout";
import discordRouter from "./api/routes/login/discord";
import osuRouter from "./api/routes/login/osu";
import userRouter from "./api/routes/user";
import helloWorldRouter from "./api/routes/helloWorld";

import mcaRouter from "../MCA-AYIM/api/routes/mca";
import mcaUserRouter from "../MCA-AYIM/api/routes/user";
import adminRouter from "../MCA-AYIM/api/routes/admin";
import adminCategoriesRouter from "../MCA-AYIM/api/routes/admin/categories";
import adminYearsRouter from "../MCA-AYIM/api/routes/admin/years";

import nominatingRouter from "../MCA/api/routes/nominating";
import votingRouter from "../MCA/api/routes/voting";
import indexRouter from "../MCA/api/routes";
import guestRequestRouter from "../MCA/api/routes/guestRequests";
import mcaStaffRouter from "../MCA/api/routes/staff/index";
import staffNominationsRouter from "../MCA/api/routes/staff/nominations";
import staffRequestsRouter from "../MCA/api/routes/staff/requests";
import staffVotesRouter from "../MCA/api/routes/staff/votes";
import resultsRouter from "../MCA/api/routes/results";

import usersRouter from "../AYIM/api/routes/users";
import commentsRouter from "../AYIM/api/routes/comments";
import influencesRouter from "../AYIM/api/routes/influences";
import commentsReviewRouter from "../AYIM/api/routes/staff/comments";
import influencesReviewRouter from "../AYIM/api/routes/staff/influences";
import usersStaffRouter from "../AYIM/api/routes/staff/users";
import recordsRouter from "../AYIM/api/routes/records";
import statisticsRouter from "../AYIM/api/routes/statistics";
import mappersRouter from "../AYIM/api/routes/mappers";

import ormConnectionOptions from "../ormconfig";

const koa = new Koa;

koa.keys = config.koaKeys;
koa.proxy = true;
koa.use(Session({
    domain: config.cookiesDomain,
    secure: process.env.NODE_ENV !== "development",
    httpOnly: true,
}, koa));
koa.use(BodyParser());
koa.use(passport.initialize());
koa.use(passport.session());

koa.use(koaCash({
    maxAge: 60 * 60 * 1000,
    hash (ctx) {
        return ctx.originalUrl;
    },
    get (key) {
        return Promise.resolve(cache.get(key));
    },
    set (key, value, maxAge) {
        cache.set(key, value, maxAge);
        return Promise.resolve();
    },
}));

// Error handler
koa.use(async (ctx, next) => {
    try {
        if (ctx.originalUrl !== "/favicon.ico" && process.env.NODE_ENV === "development") {
            console.log("\x1b[33m%s\x1b[0m", ctx.originalUrl);
        }

        await next();
    } catch (err: any) {
        console.log(err);
        
        ctx.status = err.status || 500;
        ctx.body = { error: "Something went wrong!" };
    }
});

// Login
koa.use(Mount("/api/login/discord", discordRouter.routes()));
koa.use(Mount("/api/login/osu", osuRouter.routes()));
koa.use(Mount("/api/logout", logoutRouter.routes()));

// Main site info
koa.use(Mount("/api/user", userRouter.routes()));

// MCA
koa.use(Mount("/api/mcaInfo", indexRouter.routes()));
koa.use(Mount("/api/guestRequests", guestRequestRouter.routes()));

koa.use(Mount("/api/nominating", nominatingRouter.routes()));
koa.use(Mount("/api/voting", votingRouter.routes()));
koa.use(Mount("/api/results", resultsRouter.routes()));

koa.use(Mount("/api/staff/nominations", staffNominationsRouter.routes()));
koa.use(Mount("/api/staff/votes", staffVotesRouter.routes()));
koa.use(Mount("/api/staff/requests", staffRequestsRouter.routes()));

// AYIM
koa.use(Mount("/api/users", usersRouter.routes()));
koa.use(Mount("/api/records", recordsRouter.routes()));
koa.use(Mount("/api/statistics", statisticsRouter.routes()));
koa.use(Mount("/api/mappers", mappersRouter.routes()));
koa.use(Mount("/api/comments", commentsRouter.routes()));
koa.use(Mount("/api/influences", influencesRouter.routes()));

koa.use(Mount("/api/staff/comments", commentsReviewRouter.routes()));
koa.use(Mount("/api/staff/influences", influencesReviewRouter.routes()));
koa.use(Mount("/api/staff/users", usersStaffRouter.routes()));

// MCA-AYIM
koa.use(Mount("/api/mca", mcaRouter.routes()));
koa.use(Mount("/api/mca/user", mcaUserRouter.routes()));

koa.use(Mount("/api/admin", adminRouter.routes()));
koa.use(Mount("/api/admin/years", adminCategoriesRouter.routes()));
koa.use(Mount("/api/admin/years", adminYearsRouter.routes()));

koa.use(Mount("/api/staff", mcaStaffRouter.routes()));

// Hello World!
koa.use(Mount("/", helloWorldRouter.routes()));
koa.use(Mount("/api", helloWorldRouter.routes()));


createConnection(ormConnectionOptions)
    .then((connection) => {
        console.log(`Connected to the ${connection.options.database} (${connection.options.name}) database!`);
        setupPassport();
        koa.listen(config.api.port);
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));
