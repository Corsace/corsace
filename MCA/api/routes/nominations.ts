import Router from "@koa/router";
import { isLoggedInOsu } from "../../../Server/middleware";
import { Nomination } from "../../../Models/MCA_AYIM/nomination";
import { Category } from "../../../Models/MCA_AYIM/category";
import { Beatmapset } from "../../../Models/beatmapset";
import { User } from "../../../Models/user";
import { isEligibleFor, isEligibleCurrentYear, isPhaseStarted, isPhase, validatePhaseYear } from "../middleware";
import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";
import stageSearch from "./stageSearch";

const nominationsRouter = new Router();

nominationsRouter.use(isLoggedInOsu);
nominationsRouter.use(validatePhaseYear);
nominationsRouter.use(isPhaseStarted("nomination"));

nominationsRouter.get("/:year?", async (ctx) => {
    const [nominations, categories] = await Promise.all([
        Nomination.find({
            where: {
                nominator: ctx.state.user,
            },
            relations: ["beatmapset", "user", "category", "nominator"],
        }),
        Category.find({
            mca: {
                year: ctx.state.year,
            },
        }),
    ]);

    const categoryInfos: CategoryStageInfo[] = categories.map(x => {
        const infos = x.getInfo() as CategoryStageInfo;
        infos.count = nominations.filter(y => y.category.ID === x.ID).length;
        return infos;
    });

    ctx.body = {
        nominations,
        categories: categoryInfos,
    };
});

nominationsRouter.get("/:year?/search", stageSearch("nominating", async (ctx, category) => {
    const nominations = await Nomination.find({
        nominator: ctx.state.user,
    });
    if (!category.isRequired && !nominations.some(nom => nom.category.name === "Grand Award" && nom.category.type === (category.type === CategoryType.Beatmapsets ? CategoryType.Beatmapsets : CategoryType.Users)))
        return ctx.body = { error: "Please nominate in the Grand Award categories first!" };
        
    return nominations;
}));

nominationsRouter.post("/create", isPhase("nomination"), isEligibleCurrentYear, async (ctx) => {
    const category = await Category.findOneOrFail(ctx.request.body.categoryId);
    
    if (!isEligibleFor(ctx.state.user, category.mode.ID, new Date().getFullYear() - 1))
        return ctx.body = { 
            error: "You weren't active for this mode",
        };
    
    const nominations = await Nomination.find({
        nominator: ctx.state.user,
        category,
    });

    if (nominations.length >= category.maxNominations) {
        return ctx.body = { 
            error: "You have already reached the max amount of nominations for this category! Please remove any current nomination(s) you may have in order to nominate anything else!", 
        };
    }

    const nomination = new Nomination();
    nomination.nominator = ctx.state.user;
    nomination.category = category;

    let beatmapset: Beatmapset;
    let user: User;

    if (category.type == CategoryType.Beatmapsets) {
        beatmapset = await Beatmapset.findOneOrFail(ctx.request.body.nomineeId, {
            relations: ["beatmaps"],
        });

        if (beatmapset.approvedDate.getUTCFullYear() !== category.mca.year)
            return ctx.body = {
                error: "Mapset is ineligible for the given MCA year!",
            };

        if (nominations.some(n => n.beatmapset?.ID === beatmapset.ID)) {
            return ctx.body = {
                error: "You have already nominated this beatmap!", 
            };
        }

        nomination.beatmapset = beatmapset;
    } else if (category.type == CategoryType.Users) {
        user = await User.findOneOrFail(ctx.request.body.nomineeId);

        if (nominations.some(n => n.user?.ID === user.ID)) {
            return ctx.body = {
                error: "You have already nominated this user!", 
            };
        }

        nomination.user = user;
    }
    
    await nomination.save();

    ctx.body = nomination;
});

nominationsRouter.delete("/remove/:category/:id", isPhase("nomination"), isEligibleCurrentYear, async (ctx) => {
    const category = await Category.findOneOrFail(ctx.params.category);
    const nominations = await Nomination.find({
        nominator: ctx.state.user,
    });
    const nomination = nominations.find(nom => category.type == CategoryType.Beatmapsets ? nom.beatmapset?.ID == ctx.params.id : nom.user?.ID == ctx.params.id);
    if (!nomination)
        return ctx.body = {
            error: "Could not find specified nomination!",
        };

    if (nomination.category.isRequired && nominations.some(nom => !nom.category.isRequired))
        return ctx.body = {
            error: "You cannot remove nominations in required categories if you have nominations in non-required categories!",
        };
    
    await nomination.remove();

    ctx.body = {
        success: "ok",
    };
});

export default nominationsRouter;
