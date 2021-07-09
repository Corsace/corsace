import Router from "@koa/router";
import { hasRole, isCaptain, isHeadStaff } from "../../../Server/middleware";

const qualifierRouter = new Router();

// Get list of qualifiers
qualifierRouter.get("/", async (ctx) => {

});

// Get qualifier mappool
qualifierRouter.get("/mappool", async (ctx) => {

});

// Get qualifier scores
qualifierRouter.get("/scores", async (ctx) => {

});

// Get specific qualifier's info
qualifierRouter.get("/qualifier/:id", async (ctx) => {

});

// Join/leave qualifier as a team
qualifierRouter.patch("/team", notQualifierDeadline, isCaptain, async (ctx) => {

});

// Join/leave qualifier as a referee
qualifierRouter.patch("/referee", hasRole("open", "referee"), async (ctx) => {

});

// Insert mp link + data into qualifier
qualifierRouter.put("/mp", hasRole("open", "referee"), async (ctx) => {

});

// Create qualifier
qualifierRouter.get("/create", isHeadStaff, async (ctx) => {

});

// Delete qualifier
qualifierRouter.get("/delete", isHeadStaff, async (ctx) => {

});

// Publicize/privatize qualifier scores
qualifierRouter.patch("/public", isHeadStaff, async (ctx) => {

});

// Add team to qualifier
qualifierRouter.get("/add", hasRole("corsace", "scheduler"), async (ctx) => {

});

// Remove team from qualifier
qualifierRouter.get("/remove", hasRole("corsace", "scheduler"), async (ctx) => {

});

export default qualifierRouter;