import "reflect-metadata";
import { config } from "node-config-ts";
import baseServer from "./baseServer";
import koaCash from "koa-cash";
import koaBody from "koa-body";
import Mount from "koa-mount";
import passport from "koa-passport";
import Session from "koa-session";
import { cache } from "./cache";
import { setupPassport } from "./passportFunctions";

import osuURIRouter from "./api/routes/osuuri";

import logoutRouter from "./api/routes/login/logout";
import discordRouter from "./api/routes/login/discord";
import osuRouter from "./api/routes/login/osu";
import userRouter from "./api/routes/user";

import mcaRouter from "./api/routes/mca";
import adminRouter from "./api/routes/admin";
import adminCategoriesRouter from "./api/routes/admin/categories";
import adminYearsRouter from "./api/routes/admin/years";

import nominatingRouter from "./api/routes/nominating";
import votingRouter from "./api/routes/voting";
import guestRequestRouter from "./api/routes/guestRequests";
import mcaStaffRouter from "./api/routes/staff/mca";
import staffNominationsRouter from "./api/routes/staff/nominations";
import staffRequestsRouter from "./api/routes/staff/requests";
import staffVotesRouter from "./api/routes/staff/votes";
import resultsRouter from "./api/routes/results";

import usersRouter from "./api/routes/users";
import commentsRouter from "./api/routes/comments";
import influencesRouter from "./api/routes/influences";
import commentsReviewRouter from "./api/routes/staff/comments";
import influencesReviewRouter from "./api/routes/staff/influences";
import recordsRouter from "./api/routes/records";
import statisticsRouter from "./api/routes/statistics";
import mappersRouter from "./api/routes/mappers";

import tournamentRouter from "./api/routes/tournament";

import qualifierRouter from "./api/routes/qualifier";
import matchupRouter from "./api/routes/matchup";

import teamRouter from "./api/routes/team";
import inviteRouter from "./api/routes/team/invite";

import ormConfig from "../ormconfig";
import serve from "koa-static";
import path from "path";

const koa = baseServer;

koa.use(Session({
    domain: config.cookiesDomain,
    secure: process.env.NODE_ENV !== "development",
    httpOnly: true,
    renew: true,
    maxAge: 60 * 24 * 60 * 60 * 1000, // 2 months
}, koa));
koa.use(koaBody({ 
    patchKoa: true,
    multipart: true,
    formidable: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFields: 1,
    },
}));
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

// Public
koa.use(Mount("/public", serve(path.join(__dirname, "../public"))));

// General
koa.use(Mount("/api/osuuri", osuURIRouter.routes()));

/// Login
koa.use(Mount("/api/login/discord", discordRouter.routes()));
koa.use(Mount("/api/login/osu", osuRouter.routes()));
koa.use(Mount("/api/logout", logoutRouter.routes()));

/// User
koa.use(Mount("/api/user", userRouter.routes()));

/// Staff
koa.use(Mount("/api/staff/mca", mcaStaffRouter.routes()));
koa.use(Mount("/api/staff/comments", commentsReviewRouter.routes()));
koa.use(Mount("/api/staff/influences", influencesReviewRouter.routes()));
koa.use(Mount("/api/staff/nominations", staffNominationsRouter.routes()));
koa.use(Mount("/api/staff/votes", staffVotesRouter.routes()));
koa.use(Mount("/api/staff/requests", staffRequestsRouter.routes()));

/// Admin
koa.use(Mount("/api/admin", adminRouter.routes()));
koa.use(Mount("/api/admin/years", adminCategoriesRouter.routes()));
koa.use(Mount("/api/admin/years", adminYearsRouter.routes()));

// MCA-AYIM
koa.use(Mount("/api/mca", mcaRouter.routes()));
koa.use(Mount("/api/guestRequests", guestRequestRouter.routes()));

koa.use(Mount("/api/nominating", nominatingRouter.routes()));
koa.use(Mount("/api/voting", votingRouter.routes()));
koa.use(Mount("/api/results", resultsRouter.routes()));

koa.use(Mount("/api/users", usersRouter.routes()));
koa.use(Mount("/api/records", recordsRouter.routes()));
koa.use(Mount("/api/statistics", statisticsRouter.routes()));
koa.use(Mount("/api/mappers", mappersRouter.routes()));
koa.use(Mount("/api/comments", commentsRouter.routes()));
koa.use(Mount("/api/influences", influencesRouter.routes()));

// Tournaments
/// Tournament
koa.use(Mount("/api/tournament", tournamentRouter.routes()));

/// Team
koa.use(Mount("/api/team", teamRouter.routes()));
koa.use(Mount("/api/team/invite", inviteRouter.routes()));

/// Matchup
koa.use(Mount("/api/qualifier", qualifierRouter.routes()));
koa.use(Mount("/api/matchup", matchupRouter.routes()));

ormConfig.initialize()
    .then(async (connection) => {
        console.log(`Connected to the ${connection.options.database} database!`);
        setupPassport();
        koa.listen(config.api.port);
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));
