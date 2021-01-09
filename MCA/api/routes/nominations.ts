import Router from "koa-router";
import { isLoggedInOsu } from "../../../CorsaceServer/middleware";
import { Nomination } from "../../../CorsaceModels/MCA_AYIM/nomination";
import { Category, CategoryType, CategoryStageInfo } from "../../../CorsaceModels/MCA_AYIM/category";
import { Beatmapset, BeatmapsetInfo } from "../../../CorsaceModels/beatmapset";
import { User, UserCondensedInfo } from "../../../CorsaceModels/user";
import { isEligibleFor, isEligibleCurrentYear, isPhaseStarted, isPhase, validatePhaseYear } from "../middleware";
import { getRepository } from "typeorm";
import { ModeDivisionType } from "../../../CorsaceModels/MCA_AYIM/modeDivision";

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

nominationsRouter.get("/search/:mode/:category/:order/:skip?/:year?/", async (ctx) => {
    let list: BeatmapsetInfo[] | UserCondensedInfo[] = [];
    let setList: BeatmapsetInfo[] = [];
    let userList: UserCondensedInfo[] = [];
    const category = await Category.findOneOrFail(ctx.params.category);

    // Obtain mode and amount to skip
    let mode = 1;
    if (/\d+/.test(ctx.params.mode))
        mode = parseInt(ctx.params.mode);
    const modeString = ModeDivisionType[mode];

    let skip = 0;
    if (/\d+/.test(ctx.params.skip))
        skip = parseInt(ctx.params.skip);
    
    // Check if this is the intiial call, add currently nominated beatmaps/users at the top of the list
    if (skip === 0) {
        let nominations = await Nomination.find({
            nominator: ctx.state.user,
        });
        if (!category.isRequired && !nominations.some(nom => nom.category.name === "Grand Award" && nom.category.type === (category.type === CategoryType.Beatmapsets ? CategoryType.Beatmapsets : CategoryType.Users)))
            return ctx.body = { error: "Please nominate in the Grand Award categories first!" };
        
        nominations = nominations.filter(nom => nom.category.ID === category.ID);
        if (category.type == CategoryType.Beatmapsets)
            setList = nominations.map(nom => nom.beatmapset?.getInfo(true) as BeatmapsetInfo);  
        else if (category.type == CategoryType.Users)
            userList = nominations.map(nom => nom.user?.getCondensedInfo(true) as UserCondensedInfo);
    }
    

    // Make sure user is eligible to nominate in this mode
    if (!isEligibleFor(ctx.state.user, mode, ctx.state.year))
        return ctx.body = { error: "Not eligible for this mode!" };
    
    try {
        let count = 0;
        if (category.type == CategoryType.Beatmapsets) { // Search for beatmaps
            // Ordering
            let orderMethod = "beatmapset.approvedDate";
            let ascDesc: any = "ASC";
            if (/(artist|title|favs|creator|sr)/i.test(ctx.params.order.toLowerCase())) {
                if (ctx.params.order.toLowerCase().includes("artist"))
                    orderMethod = "beatmapset.artist";
                else if (ctx.params.order.toLowerCase().includes("title"))
                    orderMethod = "beatmapset.title";
                else if (ctx.params.order.toLowerCase().includes("favs"))
                    orderMethod = "beatmapset.favourites";
                else if (ctx.params.order.toLowerCase().includes("creator"))
                    orderMethod = "user_osuUsername";
                else if (ctx.params.order.toLowerCase().includes("sr"))
                    orderMethod = "beatmap.totalSR";
            }

            if (ctx.params.order.toLowerCase().includes("desc"))
                ascDesc = "DESC";

            // Initial repo setup
            let beatmapQueryBuilder = getRepository(Beatmapset)
                .createQueryBuilder("beatmapset")
                .leftJoinAndSelect("beatmapset.creator", "user")
                .leftJoinAndSelect("user.otherNames", "otherName")
                .innerJoinAndSelect("beatmapset.beatmaps", "beatmap", mode === 5 ? "beatmap.storyboard = :q" : "beatmap.mode = :q", { q: mode === 5 ? true : mode })
                .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: `${ctx.state.year}-01-01`, end: `${ctx.state.year+1}-01-01` });
                
            // Check if the category has filters since this is a beatmap search
            if (category.filter) {
                if (category.filter.minLength)
                    beatmapQueryBuilder = beatmapQueryBuilder
                        .andWhere(`beatmap.hitLength>=${category.filter.minLength}`);
                if (category.filter.maxLength)
                    beatmapQueryBuilder = beatmapQueryBuilder
                        .andWhere(`beatmap.hitLength<=${category.filter.maxLength}`);
                if (category.filter.minBPM)
                    beatmapQueryBuilder = beatmapQueryBuilder
                        .andWhere(`beatmapset.BPM>=${category.filter.minBPM}`);
                if (category.filter.maxBPM)
                    beatmapQueryBuilder = beatmapQueryBuilder
                        .andWhere(`beatmapset.BPM<=${category.filter.maxBPM}`);
                if (category.filter.minSR)
                    beatmapQueryBuilder = beatmapQueryBuilder
                        .andWhere(`beatmap.totalSR>=${category.filter.minSR}`);
                if (category.filter.maxSR)
                    beatmapQueryBuilder = beatmapQueryBuilder
                        .andWhere(`beatmap.totalSR<=${category.filter.maxSR}`);
                if (category.filter.minCS)
                    beatmapQueryBuilder = beatmapQueryBuilder
                        .andWhere(`beatmap.circleSize>=${category.filter.minCS}`);
                if (category.filter.maxCS)
                    beatmapQueryBuilder = beatmapQueryBuilder
                        .andWhere(`beatmap.circleSize>=${category.filter.maxCS}`);
            }

            // Check for search text
            if (ctx.query.text)
                beatmapQueryBuilder = beatmapQueryBuilder
                    .andWhere("(beatmapset.ID LIKE :criteria OR beatmap.ID LIKE :criteria OR beatmapset.artist LIKE :criteria OR beatmapset.title LIKE :criteria OR beatmapset.tags LIKE :criteria OR beatmap.difficulty LIKE :criteria OR user.osuUsername LIKE :criteria OR user.osuUserID LIKE :criteria OR otherName.name LIKE :criteria)", {criteria: `%${ctx.query.text}%`});

            // Search
            setList.push(...await Promise.all((await beatmapQueryBuilder
                .skip(skip)
                .take(50)
                .orderBy(orderMethod, ascDesc)
                .getMany()).map(map => map.getInfo())));
            list = setList;
            count = await beatmapQueryBuilder.getCount();
        } else if (category.type == CategoryType.Users) { // Search for users
            // Ordering
            let orderMethod = "CAST(user_osuUserID AS INT)";
            let ascDesc: any = "ASC";
            if (ctx.params.order.toLowerCase().includes("alph"))
                orderMethod = "user_osuUsername";

            if (ctx.params.order.toLowerCase().includes("desc"))
                ascDesc = "DESC";

            // Initial repo setup
            let userQueryBuilder = getRepository(User)
                .createQueryBuilder("user")
                .leftJoinAndSelect("user.otherNames", "otherName")
                .leftJoinAndSelect("user.mcaEligibility", "mca")
                .where(`mca.year = :q AND mca.${modeString} = 1`, { q: ctx.state.year });

            if (category.filter?.rookie)
                userQueryBuilder = userQueryBuilder
                    .andWhere(`NOT EXISTS (SELECT * FROM mca_eligibility WHERE mca_eligibility.year < :q AND mca_eligibility.userID = user.ID AND mca.${modeString} = 1)`, { q: ctx.state.year });
        
            // Check for search text
            if (ctx.query.text)
                userQueryBuilder = userQueryBuilder
                    .andWhere("(user.osuUsername LIKE :criteria OR user.osuUserID LIKE :criteria OR otherName.name LIKE :criteria)", {criteria: `%${ctx.query.text}%`});

            // Search
            userList.push(...await Promise.all((await userQueryBuilder
                .skip(skip)
                .take(50)
                .orderBy(orderMethod, ascDesc)
                .getMany()).map(user => user.getCondensedInfo())));
            list = userList;
            count = await userQueryBuilder.getCount();
        } else
            return ctx.body = { error: "Invalid type parameter. Only 'beatmapsets' or 'users' are allowed."};

        ctx.body = {list, count};
    } catch (err) {
        console.error(err);
        ctx.body = err;
    }
});

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
