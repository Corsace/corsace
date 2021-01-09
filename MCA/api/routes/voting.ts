import Router from "koa-router";
import { isLoggedInOsu } from "../../../CorsaceServer/middleware";
import { Vote } from "../../../CorsaceModels/MCA_AYIM/vote";
import { Category, CategoryType } from "../../../CorsaceModels/MCA_AYIM/category";
import { Nomination } from "../../../CorsaceModels/MCA_AYIM/nomination";
import { isEligibleCurrentYear, isEligibleFor } from "../middleware";
import { MoreThan } from "typeorm";

async function isVotingPhase(ctx, next): Promise<any> {
    const now = new Date();
    
    // edit this date according to schedule
    if (now <= new Date(2020, 1, 1) || now >= new Date(2020, 4, 1)) {
        return ctx.body = {
            error: "Not the right time",
        };
    }

    await next();
}

const votingRouter = new Router();

votingRouter.use(isLoggedInOsu);
votingRouter.use(isVotingPhase);

votingRouter.get("/", async (ctx) => {
    const [votes, categories] = await Promise.all([
        Vote.find({
            where: {
                voter: ctx.state.user,
            },
            relations: ["beatmapset", "user", "category"],
        }),
        Category.createQueryBuilder("category")
            .leftJoinAndSelect("category.nominations", "nomination")
            .leftJoinAndSelect("category.mode", "mode")
            .leftJoinAndSelect("category.section", "section")
            .leftJoinAndSelect("nomination.beatmapset", "beatmapset")
            .leftJoinAndSelect("nomination.user", "user")
            .groupBy("nomination.beatmapsetID")
            .addGroupBy("nomination.userID")
            .addGroupBy("nomination.categoryID")
            .getMany(),
    ]);

    ctx.body = {
        votes,
        categories,
    };
});

// votingRouter.post("/create", async (ctx) => {
//     const nominee = await Nomination.findOneOrFail(ctx.request.body.nomineeId, {
//         relations: ["category", "user", "beatmapset"],
//     });
    
//     if (!isEligibleFor(ctx.state.user, nominee.category.modeID)) {
//         return ctx.body = { 
//             error: "You weren't active for this mode",
//         };
//     }

//     const categoryVotes = await Vote.find({
//         where: {
//             voter: ctx.state.user,
//             category: nominee.category,
//         },
//         order: {
//             choice: "DESC",
//         },
//     });
//     let hasVoted = false;

//     const vote = new Vote();
//     vote.voter = ctx.state.user;
//     vote.category = nominee.category;
    
//     if (nominee.category.type == CategoryType.Beatmapsets) {
//         vote.beatmapset = nominee.beatmapset;

//         if (categoryVotes.find(v => v.beatmapsetID == nominee.beatmapsetID)) {
//             hasVoted = true;
//         }
//     } else if (nominee.category.type == CategoryType.Users) {
//         vote.user = nominee.user;
        
//         if (categoryVotes.find(v => v.userID == nominee.userID)) {
//             hasVoted = true;
//         }
//     }
    
//     if (hasVoted) {
//         return ctx.body = {
//             error: "Already chosen",
//         };
//     }

//     if (categoryVotes.length && categoryVotes[0].choice == 10) {
//         return ctx.body = {
//             error: "Max choices given",
//         };
//     }

//     vote.choice = categoryVotes.length ? (categoryVotes[0].choice + 1) : 1;
//     await vote.save();

//     ctx.body = vote;
// });

votingRouter.post("/:id/remove", isEligibleCurrentYear, async (ctx) => {
    const vote = await Vote.findOneOrFail(ctx.params.id, {
        where: {
            voter: ctx.state.user,
        },
        relations: ["category"],
    });

    const categoryVotes = await Vote.find({
        voter: ctx.state.user,
        category: vote.category,
        choice: MoreThan(vote.choice),
    });

    for (const categoryVote of categoryVotes) {
        categoryVote.choice --;
        await categoryVote.save();
    }

    await vote.remove();

    ctx.body = await Vote.find({
        where: {
            voter: ctx.state.user,
        },
        relations: ["beatmapset", "user", "category"],
    });
});

export default votingRouter;
