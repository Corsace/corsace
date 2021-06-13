import Router from "@koa/router";
import { isLoggedInDiscord, isCorsace } from "../../../../Server/middleware";
import { Vote } from "../../../../Models/MCA_AYIM/vote";
import { Category } from "../../../../Models/MCA_AYIM/category";
import { CategoryType } from "../../../../Interfaces/category";

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
function getTotalFirstChoicesInCategory (votes: Vote[], categoryID: number): CategorySum[] {
    const categorySum: CategorySum[] = [];
    
    for (const vote of votes) {

        // Only sum current first choices
        if (vote.category.ID != categoryID || vote.choice != 1) continue;

        // check if already in categorySum
        const i = categorySum.findIndex(s => 
            (vote.category.type == CategoryType.Beatmapsets ? 
                (s.beatmapsetID == vote.beatmapset?.ID) : 
                (s.userID == vote.user?.ID)
            )
        );

        if (i !== -1)
            categorySum[i].totalChoices ++;
        else {
            categorySum.push({
                beatmapsetID: vote.beatmapset ? vote.beatmapset.ID : 0,
                userID: vote.user ? vote.user.ID : 0,
                totalChoices: 1,
            });
        }

    }

    return categorySum;
}

/**
 * Filter all the results with the lowest total choices, in a given category totals
 */
function filterLowestFirstChoicesResults (categorySum: CategorySum[]): CategorySum[] {
    categorySum.sort((a, b) => a.totalChoices - b.totalChoices);
    const lowestTotalChoices = categorySum[0].totalChoices;

    return categorySum.filter(c => c.totalChoices == lowestTotalChoices);
}

/**
 * Could, hardly, happen if all the candidates have the same ammount of first choices
 */
function isTiedResult (categoryTotalFirstChoices: CategorySum[]): boolean {
    const total = categoryTotalFirstChoices[0].totalChoices;

    return categoryTotalFirstChoices.every(c => c.totalChoices == total);
}

const adminResultsRouter = new Router;

adminResultsRouter.use(isLoggedInDiscord);
adminResultsRouter.use(isCorsace);

adminResultsRouter.get("/", async (ctx) => {
    const votes = await Vote.find({
        relations: ["category", "voter"],
        order: {
            category: "ASC",
            voter: "ASC",
            choice: "ASC",
        },
    });

    const categories = await Category.find();
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
                            (vote.beatmapset?.ID == lowCategoryResult.beatmapsetID) : 
                            (vote.user?.ID == lowCategoryResult.userID)
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

export default adminResultsRouter;
