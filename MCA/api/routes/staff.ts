import Router from "koa-router";
import { isLoggedInDiscord, isStaff } from "../../../CorsaceServer/middleware";
import { MCA } from "../../../CorsaceModels/MCA_AYIM/mca";
import { Category } from "../../../CorsaceModels/MCA_AYIM/category";
import { Nomination } from "../../../CorsaceModels/MCA_AYIM/nomination";

const staffRouter = new Router;

staffRouter.use(isLoggedInDiscord);
staffRouter.use(isStaff);

// Endpoint to obtain all MCAs and their info
staffRouter.get("/", async (ctx) => {
    const mca = await MCA.find();
    const mcaInfo = mca.map(x => x.getInfo());

    ctx.body = { mca: mcaInfo };
});

// Endpoint for getting information for a year
staffRouter.get("/:year/getYear", async (ctx) => {
    let year = ctx.params.year;
    if (!year || !/20\d\d/.test(year))
        return ctx.body = { error: "Invalid year given!" };
    
    year = parseInt(year);

    try {
        const categories = await Category.find({
            mca: {
                year,
            },
            requiresVetting: true,
        });

        if (categories.length === 0)
            return ctx.body = { error: "No categories found for this year that require vetting!" };

        ctx.body = { categories: categories.map(x => x.getInfo()) };
    } catch (e) {
        if (e)
            ctx.body = { error: e };  
    }
});

// Endpoint for getting information for a category
staffRouter.get("/:id/getCategory", async (ctx) => {
    let categoryID = ctx.params.id;
    if (!categoryID || !/\d+/.test(categoryID))
        return ctx.body = { error: "Invalid category ID given!" };

    categoryID = parseInt(categoryID);

    const category = await Category.findOneOrFail({
        ID: categoryID,
        requiresVetting: true,
    });

    if (!category)
        return ctx.body = { error: "No category found for the given ID!" };

    const nominations = await Nomination.find({
        category,
    });
    const sortedNoms = nominations.sort((a, b) => {
        if (a.isValid && !b.isValid)
            return -1;
        else if (!a.isValid && b.isValid)
            return 1;
        else if (!a.isValid && !b.isValid) {
            if (a.reviewer && !b.reviewer)
                return 1;
            else if (!a.reviewer && b.reviewer)
                return -1;
        }

        return 0;
    });

    ctx.body = { nominations: sortedNoms };
});

// Endpoint for accepting a nomination
staffRouter.put("/:id/validate", async (ctx) => {
    let nominationID = ctx.params.id;
    if (!nominationID || !/\d+/.test(nominationID))
        return ctx.body = { error: "Invalid nomination ID given!" };

    nominationID = parseInt(nominationID);
    const nomination = await Nomination.findOneOrFail(nominationID);

    if (!nomination)
        return ctx.body = { error: "No nomination found for the given ID!" };

    nomination.isValid = true;
    nomination.reviewer = ctx.state.user;
    nomination.lastReviewedAt = new Date;
    await nomination.save();
    ctx.body = { error: false, nomination };
});

// Endpoint for rejecting a nomination
staffRouter.put("/:id/invalidate", async (ctx) => {
    let nominationID = ctx.params.id;
    if (!nominationID || !/\d+/.test(nominationID))
        return ctx.body = { error: "Invalid nomination ID given!" };

    nominationID = parseInt(nominationID);
    const nomination = await Nomination.findOneOrFail(nominationID);

    if (!nomination)
        return ctx.body = { error: "No nomination found for the given ID!" };

    nomination.isValid = false;
    nomination.reviewer = ctx.state.user;
    nomination.lastReviewedAt = new Date;
    await nomination.save();
    ctx.body = { error: false, nomination };
});

export default staffRouter;
