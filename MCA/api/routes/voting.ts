import Router from "@koa/router";
import { isLoggedInOsu } from "../../../Server/middleware";
import { isEligible, isEligibleFor, isPhaseStarted, validatePhaseYear, isPhase } from "../middleware";
import { Vote } from "../../../Models/MCA_AYIM/vote";
import { Category } from "../../../Models/MCA_AYIM/category";
import { CategoryType } from "../../../Interfaces/category";
import stageSearch from "./stageSearch";
import { Beatmapset } from "../../../Models/beatmapset";
import { User } from "../../../Models/user";
import { MoreThan, Not } from "typeorm";

const votingRouter = new Router();

votingRouter.use(isLoggedInOsu);

votingRouter.get("/:year?", validatePhaseYear, isPhaseStarted("voting"), async (ctx) => {
    const [votes, categories] = await Promise.all([
        Vote.populate()
            .where("category.mcaYear = :year", { year: ctx.state.year })
            .andWhere("voter.ID = :id", { id: ctx.state.user.ID })
            .getMany(),
            
        Category.find({
            mca: {
                year: ctx.state.year,
            },
        }),
    ]);

    const categoryInfos = categories.map(c => c.getInfo());

    ctx.body = {
        votes,
        categories: categoryInfos,
    };
});

votingRouter.get("/:year?/search", validatePhaseYear, isPhaseStarted("voting"), stageSearch("voting", async (ctx, category) => {
    const votes = await Vote.populate()
        .where("category.mcaYear = :year", { year: ctx.state.year })
        .andWhere("voter.ID = :id", { id: ctx.state.user.ID })
        .andWhere("category.type = :categoryType", { categoryType: category.type })
        .getMany();

    if (
        !category.isRequired && 
        !votes.some(v => v.category.name === "grandAward" && v.category.type === (category.type === CategoryType.Beatmapsets ? CategoryType.Beatmapsets : CategoryType.Users))
    ) {
        throw "Please vote in the Grand Award categories first!";
    }

    return votes;
}));

votingRouter.post("/:year?/create", validatePhaseYear, isPhase("voting"), async (ctx) => {
    const nomineeId = ctx.request.body.nomineeId;
    const categoryId = ctx.request.body.category;
    const choice = ctx.request.body.choice;

    const category = await Category.findOneOrFail(categoryId);
    
    if (choice < 1 || choice > 100) {
        return ctx.body = {
            error: "Invalid choice",
        };
    }

    let nominee: Beatmapset | User;

    if (category.type === CategoryType.Beatmapsets) {
        nominee = await Beatmapset.findOneOrFail(nomineeId, {
            relations: ["nominationsReceived"],
        });
    } else {
        nominee = await User.findOneOrFail(nomineeId, {
            relations: ["nominationsReceived"],
        });
    }

    if (!nominee.nominationsReceived.length || !nominee.nominationsReceived.some(n => n.category.ID === category.ID)) {
        return ctx.body = {
            error: `It wasn't nominated :(`,
        };
    }
    
    if (!isEligibleFor(ctx.state.user, category.mode.ID, ctx.state.year)) {
        return ctx.body = {
            error: "You weren't active for this mode",
        };
    }

    const categoryVotes = await Vote.find({
        voter: ctx.state.user,
        category,
    });

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
        vote.beatmapset = nominee as Beatmapset;

        if (categoryVotes.some(v => v.beatmapsetID == nominee.ID)) {
            alreadyVoted = true;
        }
    } else if (category.type === CategoryType.Users) {
        vote.user = nominee as User;
        
        if (categoryVotes.some(v => v.userID == nominee.ID)) {
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

votingRouter.post("/:id/remove", validatePhaseYear, isPhase("voting"), isEligible, async (ctx) => {
    const vote = await Vote.findOneOrFail({
        where: {
            ID: ctx.params.id,
            voter: ctx.state.user.ID,
        },
        relations: [
            "category",
        ],
    });

    const otherVotes = await Vote.find({
        ID: Not(ctx.params.id),
        voter: ctx.state.user.ID,
        category: vote.category,
        choice: MoreThan(vote.choice),
    });

    await vote.remove();
    await Promise.all([
        otherVotes.map(v => {
            v.choice--;
            return v.save();
        }),
    ]);

    ctx.body = {
        success: "removed",
    };
});

votingRouter.post("/:id/swap", validatePhaseYear, isPhase("voting"), isEligible, async (ctx) => {
    const vote = await Vote.findOneOrFail({
        where: {
            ID: ctx.params.id,
            voter: ctx.state.user.ID,
        },
        relations: [
            "category",
        ],
    });
    
    const swapVote = await Vote.findOneOrFail({
        ID: ctx.request.body.swapId,
        voter: ctx.state.user.ID,
        category: vote.category,
    });

    const voteChoice = vote.choice;
    vote.choice = swapVote.choice;
    swapVote.choice = voteChoice;
    
    await Promise.all([
        vote.save(),
        swapVote.save(),
    ]);

    ctx.body = {
        success: "swapped",
    };
});

export default votingRouter;
