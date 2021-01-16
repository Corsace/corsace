import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { Category } from "../../../../Models/MCA_AYIM/category";

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
staffRouter.get("/:year/categories", async (ctx) => {
    let year = ctx.params.year;
    if (!year || !/20\d\d/.test(year))
        return ctx.body = { error: "Invalid year given!" };
    
    year = parseInt(year);
    
    const categories = await Category.find({
        mca: {
            year,
        },
        requiresVetting: true,
    });

    if (categories.length === 0)
        return ctx.body = { error: "No categories found for this year that require vetting!" };

    ctx.body = { categories: categories.map(x => x.getInfo()) };
});

export default staffRouter;
