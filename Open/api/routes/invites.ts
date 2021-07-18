import Router from "@koa/router";
import { hasNoTeam, isLoggedInDiscord, isRegistration, notOpenStaff } from "../../../Server/middleware";

const invitesRouter = new Router();

// Get list of invites
invitesRouter.get("/invites", isLoggedInDiscord, hasNoTeam, notOpenStaff, isRegistration, async (ctx) => {

});

// Accept target invite
invitesRouter.put("/accept", isLoggedInDiscord, hasNoTeam, notOpenStaff, isRegistration, async (ctx) => {

});

// Decline target invite
invitesRouter.put("/decline", isLoggedInDiscord, hasNoTeam, notOpenStaff, isRegistration, async (ctx) => {

});

export default invitesRouter;