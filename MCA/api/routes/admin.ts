import Router from "koa-router";
import { isLoggedInDiscord, isCorsace } from "../../../CorsaceServer/middleware";
import { Vote } from "../../../CorsaceModels/MCA_AYIM/vote";
import { Category, CategoryGenerator, CategoryType } from "../../../CorsaceModels/MCA_AYIM/category";
import { MCA } from "../../../CorsaceModels/MCA_AYIM/mca";
import { ModeDivision } from "../../../CorsaceModels/MCA_AYIM/modeDivision";

interface CategoryWinners {
    categoryID: number;
    beatmapsetID?: number;
    userID?: number;
    totalChoices: number;
}

interface CategorySum {
    beatmapsetID?: number;
    userID?: number;
    totalChoices: number;
}

/**
 * Sum all the first, and only first, choices, differenciating by beatmapsetID or userID, for a given category
 */
function getTotalFirstChoicesInCategory(votes: Vote[], categoryID: number): CategorySum[] {
    const categorySum: CategorySum[] = [];
    
    for (const vote of votes) {

        // Only sum current first choices
        if (vote.category.ID != categoryID || vote.choice != 1) continue;

        // check if already in categorySum
        const i = categorySum.findIndex(s => 
            (vote.category.type == CategoryType.Beatmapsets ? 
                (s.beatmapsetID == vote.beatmapsetID) : 
                (s.userID == vote.userID)
            )
        );

        if (i !== -1)
            categorySum[i].totalChoices ++;
        else {
            categorySum.push({
                beatmapsetID: vote.beatmapsetID,
                userID: vote.userID,
                totalChoices: 1,
            });
        }

    }

    return categorySum;
}

/**
 * Filter all the results with the lowest total choices, in a given category totals
 */
function filterLowestFirstChoicesResults(categorySum: CategorySum[]): CategorySum[] {
    categorySum.sort((a, b) => a.totalChoices - b.totalChoices);
    const lowestTotalChoices = categorySum[0].totalChoices;

    return categorySum.filter(c => c.totalChoices == lowestTotalChoices);
}

/**
 * Could, hardly, happen if all the candidates have the same ammount of first choices
 */
function isTiedResult(categoryTotalFirstChoices: CategorySum[]): boolean {
    const total = categoryTotalFirstChoices[0].totalChoices;

    return categoryTotalFirstChoices.every(c => c.totalChoices == total);
}

const adminRouter = new Router;
const categoryGenerator = new CategoryGenerator;

adminRouter.use(isLoggedInDiscord);
adminRouter.use(isCorsace);

// Endpoint to obtain all MCAs and their info
adminRouter.get("/", async (ctx) => {
    const mca = await MCA.find();
    const mcaInfo = mca.map(x => x.getInfo());

    ctx.body = { mca: mcaInfo };
});

// Endpoints for creating a year
adminRouter.post("/createYear", async (ctx) => {
    const data = ctx.request.body;

    if (!data.year) {
        return ctx.body = { error: "Missing year!" };
    } else if (!data.nominationStart) {
        return ctx.body = { error: "Missing nominationStart date!" };
    } else if (!data.nominationEnd) {
        return ctx.body = { error: "Missing nominationEnd date!" };
    } else if (!data.votingStart) {
        return ctx.body = { error: "Missing votingStart date!" };
    } else if (!data.votingEnd) {
        return ctx.body = { error: "Missing votingEnd date!" };
    } else if (!data.results) {
        return ctx.body = { error: "Missing results date!" };
    }

    try {
        let mca = await MCA.findOne(data.year);
        if (mca)
            return ctx.body = { error: "This year already exists!" };
        
        mca = new MCA;
        mca.year = data.year;
        mca.nomination = {
            start: data.nominationStart,
            end: data.nominationEnd,
        };
        mca.voting = {
            start: data.votingStart,
            end: data.votingEnd,
        };
        mca.results = data.results;

        await mca.save();

        // Create the grand awards
        const modes = await ModeDivision.find();
        for (const mode of modes) {
            const userGrand = categoryGenerator.createGrandAward(mca, mode, CategoryType.Users);
            const mapGrand = categoryGenerator.createGrandAward(mca, mode, CategoryType.Beatmapsets);

            await Promise.all([userGrand.save(), mapGrand.save()]);
        }

        ctx.body = { message: "Success! attached is the new MCA.", mca };
    } catch (e) {
        if (e)
            ctx.body = { error: e };
    }
});

// Endpoint for getting information for a year
adminRouter.get("/:year/getYear", async (ctx) => {
    let year = ctx.params.year;
    if (!year || !/20\d\d/.test(year))
        return ctx.body = { error: "Invalid year given!" };
    
    year = parseInt(year);

    try {
        const categories = await Category.find({
            mca: {
                year,
            },
        });

        if (categories.length === 0)
            return ctx.body = { error: "No categories found for this year!" };

        ctx.body = { categories: categories.map(x => x.getInfo()) };
    } catch (e) {
        if (e)
            ctx.body = { error: e };  
    }
});

// Endpoint for deleting a year
adminRouter.delete("/:year/deleteYear", async (ctx) => {
    let year = ctx.params.year;
    if (!year || !/20\d\d/.test(year))
        return ctx.body = { error: "Invalid year given!" };
    
    year = parseInt(year);

    try {
        const mca = await MCA.findOne(year);
        if (!mca)
            return ctx.body = { error: "This year doesn't exist!" };

        const categories = await Category.find({
            mca: {
                year,
            },
        });
        for (const category of categories) {
            await category.remove();
        }

        const mcares = await mca.remove();
        
        ctx.body = { message: "Success! attached is the delete result.", mcares };
    } catch (e) {
        if (e)
            ctx.body = { error: e };  
    }
});

// Endpoint for creating a category
adminRouter.post("/createCategory", async (ctx) => {
    const data = ctx.request.body;

    if (!data.name)
        return ctx.body = { error: "Missing category name!" };
    else if (!data.desc)
        return ctx.body = { error: "Missing category description!" };
    else if (!data.type)
        return ctx.body = { error: "Missing category type!" };
    else if (!data.nomCount || data.nomCount <= 0)
        return ctx.body = { error: "Missing non-zero positive nomination count!" };
    else if (!data.year)
        return ctx.body = { error: "Missing year for category!" };
    else if (!data.mode)
        return ctx.body = { error: "Missing mode for category!" };

    try {
        let categoryType: CategoryType;
        if (data.type === "users")
            categoryType = CategoryType.Users;
        else if (data.type === "beatmapsets")
            categoryType = CategoryType.Beatmapsets;
        else
            return ctx.body = { error: "The category type provided does not exist!"};

        const mca = await MCA.findOne(data.year);
        if (!mca)
            return ctx.body = { error: "MCA for this year does not exist currently!" };

        const mode = await ModeDivision.findOne();
        if (!mode)
            return ctx.body = { error: "The mode provided does not exist!" };

        const category = categoryGenerator.create(data.name, data.desc, categoryType, mca, mode);
        
        if (data.type === "beatmapsets" && data.filter)
            category.addFilter(data.filter);
        else if (data.type === "users" && data.rookie)
            category.addFilter({rookie: true});

        if (data.nomCount !== 3)
            category.maxNominations = data.nomCount;

        if (data.required)
            category.isRequired = data.required;
        
        if (data.vetting)
            category.requiresVetting = data.vetting;
        
        await category.save();

        ctx.body = { message: "Success! attached is the new category.", category };
    } catch (e) {
        if (e) ctx.body = { error: e };
    }
});

// Endpoint for getting information for a category
adminRouter.get("/:id/getCategory", async (ctx) => {
    let categoryID = ctx.params.id;
    if (!categoryID || !/\d+/.test(categoryID))
        return ctx.body = { error: "Invalid category ID given!" };

    categoryID = parseInt(categoryID);

    const category = await Category.findOne(categoryID);

    if (!category)
        return ctx.body = { error: "No category found for the given ID!" };

    console.log(category);

    ctx.body = { error: "Gj" };
});

// Endpoint for deleting a category
adminRouter.delete("/:id/deleteCategory", async (ctx) => {
    let categoryID = ctx.params.id;
    if (!categoryID || !/\d+/.test(categoryID))
        return ctx.body = { error: "Invalid category ID given!" };

    categoryID = parseInt(categoryID);

    try {
        const category = await Category.findOne(categoryID);
        if (!category)
            return ctx.body = { error: "No category with this ID exists!" };

        const categoryRes = await category.remove(); 
        ctx.body = { message: "Success! attached is the delete result.", categoryRes };
    } catch (e) {
        if (e)
            ctx.body = { error: e };  
    }
});

adminRouter.get("/results", async (ctx) => {
    const votes = await Vote.find({
        relations: ["category", "voter"],
        order: {
            category: "ASC",
            voter: "ASC",
            choice: "ASC",
        },
    });

    const categories = await Category.find({});
    const winners: CategoryWinners[] = [];
    
    for (const category of categories) {

        // loop till there isn't any vote with first choices in the current category
        while (votes.some(v => v.category.ID == category.ID && v.choice != 0)) {
            const categoryTotalFirstChoices = getTotalFirstChoicesInCategory(votes, category.ID);

            if (categoryTotalFirstChoices.length == 1 || isTiedResult(categoryTotalFirstChoices)) {
                for (const categoryTotal of categoryTotalFirstChoices) {
                    winners.push({
                        categoryID: category.ID,
                        userID: categoryTotal.userID,
                        beatmapsetID: categoryTotal.beatmapsetID,
                        totalChoices: categoryTotal.totalChoices,
                    });
                }

                break;
            }

            const lowestCategoryResults = filterLowestFirstChoicesResults(categoryTotalFirstChoices);
            
            // remove all the votes given for the lowest total of first choices, and move the remaining up by 1
            for (const lowCategoryResult of lowestCategoryResults) {
    
                let voterID = 0;
                let choiceGone = 1;
    
                for (const vote of votes) {
    
                    // 0 = removed, so skipping it
                    if (vote.choice == 0) continue;
    
                    if (vote.voter.ID != voterID) {
                        choiceGone = 1;
                    }
    
                    if (category.ID == vote.category.ID &&
                        (vote.category.type == CategoryType.Beatmapsets ? 
                            (vote.beatmapsetID == lowCategoryResult.beatmapsetID) : 
                            (vote.userID == lowCategoryResult.userID)
                        )
                    ) {
    
                        // remove vote
                        vote.choice = 0;
    
                        voterID = vote.voter.ID;
    
                    } else if (
                        vote.category.ID == category.ID && 
                            vote.voter.ID == voterID && 
                            vote.choice > choiceGone
                    ) {
                        
                        // move to higher choice position if previous was removed
                        vote.choice = choiceGone;
                        choiceGone ++;
    
                    }
                }
            }
        }
    }

    ctx.body = {
        winners,
    };
});

export default adminRouter;
