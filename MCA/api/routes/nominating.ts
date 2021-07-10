import Router from "@koa/router";
import { isLoggedIn } from "../../../Server/middleware";
import { Nomination } from "../../../Models/MCA_AYIM/nomination";
import { Category } from "../../../Models/MCA_AYIM/category";
import { Beatmapset } from "../../../Models/beatmapset";
import { User } from "../../../Models/user";
import { isEligibleFor, isEligible, isPhaseStarted, isPhase, validatePhaseYear } from "../../../MCA-AYIM/api/middleware";
import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";
import stageSearch from "./stageSearch";
import { MCAEligibility } from "../../../Models/MCA_AYIM/mcaEligibility";

const nominatingRouter = new Router();

nominatingRouter.use(isLoggedIn);

nominatingRouter.get("/:year?", validatePhaseYear, isPhaseStarted("nomination"), async (ctx) => {
    const [nominations, categories] = await Promise.all([
        Nomination
            .userNominations({
                userID: ctx.state.user.ID,
                year: ctx.state.year,
            })
            .getMany(),

        Category.find({
            where: {
                mca: {
                    year: ctx.state.year,
                },
            },
        }),
    ]);

    const filteredNominations = nominations.filter(nom => nom.category.mca.year === ctx.state.year);
    const categoryInfos: CategoryStageInfo[] = categories.map(x => x.getInfo() as CategoryStageInfo);

    ctx.body = {
        nominations: filteredNominations,
        categories: categoryInfos,
    };
});

nominatingRouter.get("/:year?/search", validatePhaseYear, isPhaseStarted("nomination"), stageSearch("nominating", async (ctx, category) => {
    return await Nomination
        .userNominations({
            userID: ctx.state.user.ID,
            year: category.mca.year,
        })
        .getMany();
}));

nominatingRouter.post("/:year?/create", validatePhaseYear, isPhase("nomination"), isEligible, async (ctx) => {
    const category = await Category.findOneOrFail({
        ID: ctx.request.body.categoryId,
    });
    const nominator: User = ctx.state.user;
    const nomineeID: number = ctx.request.body.nomineeId;
    
    if (!isEligibleFor(nominator, category.mode.ID, ctx.state.year))
        return ctx.body = { 
            error: "You weren't active for this mode",
        };
    
    const categoryNominations = await Nomination
        .userNominations({
            userID: ctx.state.user.ID,
            year: ctx.state.year,
        })
        .andWhere("nomination.categoryID = :categoryID", { categoryID: category.ID })
        .getMany();

    if (categoryNominations.length >= category.maxNominations) {
        return ctx.body = { 
            error: "You have already reached the max amount of nominations for this category! Please remove any current nomination(s) you may have in order to nominate anything else!", 
        };
    }

    let nomination = await Nomination
        .populate()
        .where("nomination.categoryID = :categoryID", { categoryID: category.ID })
        .andWhere("(nomination.userID = :nomineeID OR nomination.beatmapsetID = :nomineeID)", { nomineeID })
        .getOne();
    
    if (nomination && !nomination.isValid) {
        return ctx.body = {
            error: "Selected nominee was denied for this category",
        };
    }

    if (nomination?.nominators.some(n => n.ID === nominator.ID)) {
        throw new Error("Aldeady nominated");
    }

    if (!nomination) {
        nomination = new Nomination();
        nomination.nominators = [];
        nomination.category = category;
        nomination.isValid = true;
        let beatmapset: Beatmapset;
        let user: User;

        if (category.type == CategoryType.Beatmapsets) {
            beatmapset = await Beatmapset.findOneOrFail({
                where: {
                    ID: nomineeID,
                },
                relations: ["beatmaps"],
            });

            if (beatmapset.approvedDate.getUTCFullYear() !== category.mca.year)
                return ctx.body = {
                    error: "Mapset is ineligible for the given MCA year!",
                };

            if (categoryNominations.some(n => n.beatmapset?.ID === beatmapset.ID)) {
                return ctx.body = {
                    error: "You have already nominated this beatmap!", 
                };
            }
            // Check if the category has filters since this is a beatmap search
            if (category.filter) {
                if (category.filter.minLength && !beatmapset.beatmaps.some(beatmap => beatmap.hitLength >= category.filter!.minLength!))
                    return ctx.body = {
                        error: "Beatmapset does not exceed minimum length requirement!", 
                    };
                if (category.filter.maxLength && !beatmapset.beatmaps.some(beatmap => beatmap.hitLength <= category.filter!.maxLength!))
                    return ctx.body = {
                        error: "Beatmapset exceeds maximum length requirement!", 
                    };
                if (category.filter.minBPM && !(beatmapset.BPM >= category.filter!.minBPM!))
                    return ctx.body = {
                        error: "Beatmapset does not exceed minimum BPM requirement!", 
                    };
                if (category.filter.maxBPM && !(beatmapset.BPM <= category.filter!.maxBPM!))
                    return ctx.body = {
                        error: "Beatmapset exceeds maximum BPM requirement!", 
                    };
                if (category.filter.minSR && !beatmapset.beatmaps.some(beatmap => beatmap.totalSR >= category.filter!.minSR!))
                    return ctx.body = {
                        error: "Beatmapset does not exceed minimum SR requirement!", 
                    };
                if (category.filter.maxSR && beatmapset.beatmaps.some(beatmap => beatmap.totalSR >= category.filter!.maxSR!))
                    return ctx.body = {
                        error: "Beatmapset exceeds maximum SR requirement!", 
                    };
                if (category.filter.minCS && beatmapset.beatmaps.find(beatmap => beatmap.totalSR === beatmapset.beatmaps.reduce((prev, current) => (prev.totalSR > current.totalSR) ? prev : current).totalSR)!.circleSize < category.filter.minCS)
                    return ctx.body = {
                        error: "Beatmapset does not exceed minimum CS requirement!", 
                    };
                if (category.filter.maxCS && beatmapset.beatmaps.find(beatmap => beatmap.totalSR === beatmapset.beatmaps.reduce((prev, current) => (prev.totalSR > current.totalSR) ? prev : current).totalSR)!.circleSize > category.filter.maxCS)
                    return ctx.body = {
                        error: "Beatmapset exceeds maximum CS requirement!", 
                    };
            }

            nomination.beatmapset = beatmapset;
        } else if (category.type == CategoryType.Users) {
            user = await User.findOneOrFail({
                ID: nomineeID,
            });

            if (category.filter?.rookie) {
                const eligibilities = await MCAEligibility.find({
                    user,
                });
                if (Math.min(...eligibilities.map(e => e.year)) !== ctx.state.year)
                    return ctx.body = {
                        error: "User is not eligible for this category!", 
                    };
            }

            if (categoryNominations.some(n => n.user?.ID === user.ID)) {
                return ctx.body = {
                    error: "You have already nominated this user!", 
                };
            }

            nomination.user = user;
        }
    }

    nomination.nominators.push(nominator);
    await nomination.save();

    ctx.body = nomination;
});

nominatingRouter.delete("/:id", validatePhaseYear, isPhase("nomination"), isEligible, async (ctx) => {
    const nomination = await Nomination
        .populate()
        .andWhere("nomination.ID = :id", { id: ctx.params.id })
        .andWhere("mca.year = :year", { year: ctx.state.year })
        .getOneOrFail();

    if (!nomination.isValid)
        return ctx.body = {
            error: "Cannot remove reviewed nominations, contact a member of the staff!",
        };
    
    nomination.nominators = nomination.nominators.filter(n => n.ID !== ctx.state.user.ID);
    await nomination.save();

    ctx.body = {
        success: "ok",
    };
});

export default nominatingRouter;
