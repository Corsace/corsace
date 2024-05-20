import { CorsaceRouter } from "../../../corsaceRouter";
import { isLoggedInDiscord } from "../../../middleware";
import { Category } from "../../../../Models/MCA_AYIM/category";
import { isMCAStaff, validatePhaseYear } from "../../../middleware/mca-ayim";
import { User as APIUser } from "nodesu";
import { isCorsace } from "../../../../Server/middleware";
import { OsuOAuth, User } from "../../../../Models/user";
import { MCAEligibility } from "../../../../Models/MCA_AYIM/mcaEligibility";
import { osuClient } from "../../../osu";
import { MCAAuthenticatedState } from "koa";
import { ModeDivisionType } from "../../../../Interfaces/modes";
import { MCAInfo } from "../../../../Interfaces/mca";
import { CategoryInfo } from "../../../../Interfaces/category";

const staffRouter  = new CorsaceRouter<MCAAuthenticatedState>();

staffRouter.$use(isLoggedInDiscord);
staffRouter.$use(isMCAStaff);

// Endpoint to obtain current MCA and its info
staffRouter.$get<{ mca: MCAInfo }>("/:year", validatePhaseYear, async (ctx) => {
    if (await ctx.cashed())
        return;

    ctx.body = {
        success: true,
        mca: ctx.state.mca.getInfo(),
    };
});

// Endpoint for getting information for a year
staffRouter.$get<{ categories: CategoryInfo[] }>("/categories/:year", validatePhaseYear, async (ctx) => {
    const mca = ctx.state.mca;
    const categories = await Category.find({
        where: {
            mca: {
                year: mca.year,
            },
        },
    });

    if (categories.length === 0)
        return ctx.body = { 
            success: false,
            error: "No categories found for this year!",
        };

    ctx.body = {
        success: true,
        categories: categories.map(x => x.getInfo()),
    };
});

// Endpoint for granting direct MCA nom/vote access to users
staffRouter.$post<{ eligibility: MCAEligibility }>("/grant/:year", isCorsace, validatePhaseYear, async (ctx) => {
    if (!ctx.request.body.user)
        return ctx.body = {
            success: false,
            error: "No user ID given!",
        };
    if (!ctx.request.body.mode)
        return ctx.body = {
            success: false,
            error: "No mode given!",
        };
    if (!(ctx.request.body.mode in ModeDivisionType))
        return ctx.body = {
            success: false,
            error: "Invalid mode given!",
        };

    const mca = ctx.state.mca;
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
            return ctx.body = { 
                success: false,
                error: "Invalid user ID given!",
            };

        user = new User();
        user.country = apiUser.country.toString();
        user.osu = new OsuOAuth();
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

    eligibility[ctx.request.body.mode as keyof typeof ModeDivisionType] = true;
    eligibility.storyboard = true;
    await eligibility.save();
    return ctx.body = {
        success: true,
        eligibility,
    };
});    

export default staffRouter;
