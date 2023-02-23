import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../middleware";
import { MCA } from "../../../../Models/MCA_AYIM/mca";
import { Category } from "../../../../Models/MCA_AYIM/category";
import { validatePhaseYear } from "../../../middleware/mca-ayim";
import { User as APIUser } from "nodesu";
import { isCorsace } from "../../../../Server/middleware";
import { OAuth, User } from "../../../../Models/user";
import { MCAEligibility } from "../../../../Models/MCA_AYIM/mcaEligibility";
import { osuClient } from "../../../../Server/osu";

const staffRouter = new Router;

staffRouter.use(isLoggedInDiscord);
staffRouter.use(isStaff);

// Endpoint to obtain current MCA and its info
staffRouter.get("/:year", validatePhaseYear, async (ctx) => {
    if (await ctx.cashed())
        return;

    ctx.body = ctx.state.mca.getInfo();
});

// Endpoint for getting information for a year
staffRouter.get("/categories/:year", validatePhaseYear, async (ctx) => {
    const mca: MCA = ctx.state.mca;
    const categories = await Category.find({
        where: {
            mca: {
                year: mca.year,
            },
        },
    });

    if (categories.length === 0)
        return ctx.body = { error: "No categories found for this year!" };

    ctx.body = categories.map(x => x.getInfo());
});

// Endpoint for granting direct MCA nom/vote access to users
staffRouter.post("/grant/:year", isCorsace, validatePhaseYear, async (ctx) => {
    if (!ctx.request.body.user)
        return ctx.body = { error: "No user ID given!" };
    if (!ctx.request.body.mode)
        return ctx.body = { error: "No mode given!" };
    if (!/^(standard|taiko|fruits|mania|storyboard)$/.test(ctx.request.body.mode))
        return ctx.body = { error: "Invalid mode given!" };

    const mca: MCA = ctx.state.mca;
    let user = await User.findOne({
        where: {
            osu: {
                userID: ctx.request.body.user,
            },
        },
    });
    if (!user) {
        const apiUser = (await osuClient.user.get(ctx.request.body.user)) as APIUser;
        if (!apiUser)
            return ctx.body = { error: "Invalid user ID given!" };

        user = new User;
        user.country = apiUser.country.toString();
        user.osu = new OAuth;
        user.osu.userID = `${apiUser.userId}`;
        user.osu.username = apiUser.username;
        user.osu.avatar = "https://a.ppy.sh/" + apiUser.userId;
        await user.save(); 
    }
    let eligibility = await MCAEligibility.findOne({
        where: {
            year: mca.year,
            user: {
                ID: user.ID,
            },
        },
        relations: ["user"],
    });

    if (!eligibility) {
        eligibility = new MCAEligibility();
        eligibility.user = user;
        eligibility.year = mca.year;
    }

    eligibility[ctx.request.body.mode] = true;
    eligibility.storyboard = true;
    await eligibility.save();
});    

export default staffRouter;
