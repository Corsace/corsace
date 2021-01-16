import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { Nomination } from "../../../../Models/MCA_AYIM/nomination";

const staffNominationsRouter = new Router;

staffNominationsRouter.use(isLoggedInDiscord);
staffNominationsRouter.use(isStaff);

// Endpoint for getting information for a category
staffNominationsRouter.get("/", async (ctx) => {
    let categoryID = ctx.query.category;
    
    if (!categoryID || !/\d+/.test(categoryID))
        return ctx.body = { error: "Invalid category ID given!" };

    categoryID = parseInt(categoryID);

    const nominations = await Nomination
        .createQueryBuilder("nomination")
        .innerJoinAndSelect("nomination.category", "category")
        .where("category.requiresVetting = true")
        .andWhere("category.ID = :id", { id: categoryID })
        .orderBy("nomination.isValid", "DESC")
        .addOrderBy("nomination.reviewerID", "DESC")
        .getMany();

    ctx.body = { 
        nominations,
    };
});

// Endpoint for accepting a nomination
staffNominationsRouter.post("/:id/toggleValidation", async (ctx) => {
    let nominationID = ctx.params.id;
    if (!nominationID || !/\d+/.test(nominationID))
        return ctx.body = { error: "Invalid nomination ID given!" };

    nominationID = parseInt(nominationID);
    const nomination = await Nomination.findOneOrFail(nominationID);

    if (!nomination)
        return ctx.body = { error: "No nomination found for the given ID!" };

    nomination.isValid = !nomination.isValid;
    nomination.reviewer = ctx.state.user;
    nomination.lastReviewedAt = new Date;
    await nomination.save();
    ctx.body = { nomination };
});

export default staffNominationsRouter;
