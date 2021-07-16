import Router from "@koa/router";
import { isLoggedIn } from "../../../Server/middleware";
import { isEligible, isEligibleFor, isPhaseStarted, validatePhaseYear, isPhase } from "../../../MCA-AYIM/api/middleware";
import { Vote } from "../../../Models/MCA_AYIM/vote";
import { Category } from "../../../Models/MCA_AYIM/category";
import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";
import stageSearch from "./stageSearch";
import { Beatmapset } from "../../../Models/beatmapset";
import { User } from "../../../Models/user";
import { MoreThan, Not } from "typeorm";
import { Nomination } from "../../../Models/MCA_AYIM/nomination";

const votingRouter = new Router();

votingRouter.use(isLoggedIn);

votingRouter.get("/:year?", validatePhaseYear, isPhaseStarted("voting"), async (ctx) => {
    const [votes, categories] = await Promise.all([
        Vote.find({
            where: {
                voter: ctx.state.user,
            },
        }),
            
        Category.find({
            where: {
                mca: {
                    year: ctx.state.year,
                },
            },
        }),
    ]);

    const filteredVotes = votes.filter(vote => vote.category.mca.year === ctx.state.year);
    const categoryInfos: CategoryStageInfo[] = categories.map(c => c.getInfo() as CategoryStageInfo);

    ctx.body = {
        votes: filteredVotes,
        categories: categoryInfos,
    };
});

votingRouter.get("/:year?/search", validatePhaseYear, isPhaseStarted("voting"), stageSearch("voting", async (ctx, category) => {
    let votes = await Vote.find({
        voter: ctx.state.user,
    });
    votes = votes.filter(vote => vote.category.mca.year === category.mca.year).sort((a, b) => a.choice - b.choice);

    return votes;
}));

votingRouter.post("/:year?/create", validatePhaseYear, isPhase("voting"), isEligible, async (ctx) => {
    const nomineeId = ctx.request.body.nomineeId;
    const categoryId = ctx.request.body.category;
    const choice = ctx.request.body.choice;

    const category = await Category.findOneOrFail(categoryId);
    
    if (choice < 1 || choice > 100) {
        return ctx.body = {
            error: "Invalid choice",
        };
    }

    const nomQ = Nomination
        .createQueryBuilder("nomination")
        .where(`categoryID = ${category.ID}`);

    if (category.type === CategoryType.Beatmapsets) {
        nomQ.andWhere(`beatmapsetID = ${nomineeId}`);
    } else {
        nomQ.andWhere(`userID = ${nomineeId}`);
    }

    const exists = await nomQ.getRawOne();
    if (!exists) {
        return ctx.body = {
            error: `It wasn't nominated :(`,
        };
    }
    
    if (!isEligibleFor(ctx.state.user, category.mode.ID, ctx.state.year)) {
        return ctx.body = {
            error: "You weren't active for this mode",
        };
    }

    let votes = await Vote.find({
        voter: ctx.state.user,
    });
    votes = votes.filter(vote => vote.category.mca.year === category.mca.year);

    const categoryVotes = votes.filter(vote => vote.category.ID === category.ID);

    if (categoryVotes.some(v => v.choice === choice)) {
        return ctx.body = {
            error: `Already voted: ${choice}`,
        };
    }

    let alreadyVoted = false;

    const vote = new Vote();
    vote.voter = ctx.state.user;
    vote.category = category;
    
    if (category.type === CategoryType.Beatmapsets) {
        const nominee = await Beatmapset.findOneOrFail(nomineeId);
        vote.beatmapset = nominee;

        if (categoryVotes.some(v => v.beatmapset?.ID == nominee.ID)) {
            alreadyVoted = true;
        }
    } else if (category.type === CategoryType.Users) {
        const nominee = await User.findOneOrFail(nomineeId);
        vote.user = nominee;
        
        if (categoryVotes.some(v => v.user?.ID == nominee.ID)) {
            alreadyVoted = true;
        }
    }
    
    if (alreadyVoted) {
        return ctx.body = {
            error: "Already voted for this",
        };
    }

    vote.choice = choice;
    await vote.save();

    ctx.body = vote;
});

votingRouter.delete("/:id", validatePhaseYear, isPhase("voting"), isEligible, async (ctx) => {
    const vote = await Vote.findOneOrFail({
        where: {
            ID: ctx.params.id,
            voter: ctx.state.user.ID,
        },
        relations: [
            "category",
        ],
    });

    const otherUserVotes = await Vote.find({
        ID: Not(ctx.params.id),
        voter: ctx.state.user,
        category: vote.category,
        choice: MoreThan(vote.choice),
    });

    await vote.remove();
    await Promise.all([
        otherUserVotes.map(v => {
            v.choice--;
            return v.save();
        }),
    ]);

    ctx.body = {
        success: "removed",
    };
});

votingRouter.post("/swap", validatePhaseYear, isPhase("voting"), isEligible, async (ctx) => {
    const votesInput: Vote[] = ctx.request.body;
    const year: number = ctx.state.year;
    
    const votes = await Vote.createQueryBuilder("vote")
        .leftJoinAndSelect("vote.voter", "voter")
        .leftJoinAndSelect("vote.category", "category")
        .where("vote.id IN (:ids)", { ids: votesInput.map(v => v.ID) })
        .andWhere("voter.ID = :voterId", { voterId: ctx.state.user.ID })
        .andWhere("category.mcaYear = :year", { year })
        .getMany();

    const updates: Promise<Vote>[] = [];

    for (const vote of votes) {
        const newVote = votesInput.find(v => v.ID === vote.ID);

        if (newVote) {
            vote.choice  = newVote.choice;
            updates.push(vote.save());
        }
    }
    
    await Promise.all(updates);

    ctx.body = {
        success: "swapped",
    };
});

export default votingRouter;
