import Router from "@koa/router";
import { isLoggedInOsu } from "../../../Server/middleware";
import { isEligibleCurrentYear, isEligibleFor, isPhaseStarted, validatePhaseYear } from "../middleware";
import { Vote } from "../../../Models/MCA_AYIM/vote";
import { Category } from "../../../Models/MCA_AYIM/category";
import { CategoryType } from "../../../interfaces/category";
import stageSearch from "./stageSearch";
import { Beatmapset } from "../../../Models/beatmapset";
import { User } from "../../../Models/user";

const votingRouter = new Router();

votingRouter.use(isLoggedInOsu);
votingRouter.use(validatePhaseYear);
votingRouter.use(isPhaseStarted("voting"));

votingRouter.get("/:year?", async (ctx) => {
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

votingRouter.get("/:year?/search", stageSearch("voting", async (ctx, category) => {
    const votes = await Vote.populate()
        .where("category.mcaYear = :year", { year: ctx.state.year })
        .andWhere("voter.ID = :id", { id: ctx.state.user.ID })
        .andWhere("category.type = :categoryType", { categoryType: category.type })
        .getMany();

    if (!category.isRequired && 
        !votes.some(v => v.category.name === "Grand Award")
    ) {
        return ctx.body = { error: "Please vote in the Grand Award categories first!" };
    }

    return votes;
}));

votingRouter.post("/:year?/create", async (ctx) => {
    const nomineeId = ctx.request.body.nomineeId;
    const categoryId = ctx.request.body.category;
    const choice = ctx.request.body.choice;

    const category = await Category.findOneOrFail(categoryId);
    
    if (choice < 1 || choice > 10) {
        return ctx.body = {
            error: "Not valid choice",
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
            error: "Already chosen",
        };
    }

    vote.choice = choice;
    await vote.save();

    ctx.body = await Vote.populate()
        .where("category.mcaYear = :year", { year: ctx.state.year })
        .andWhere("voter.ID = :id", { id: vote.ID })
        .getMany();
});

votingRouter.post("/:year?/:id/remove", isEligibleCurrentYear, async (ctx) => {
    const vote = await Vote.findOneOrFail({
        ID: ctx.params.id,
        voter: ctx.state.user.ID,
    });

    await vote.remove();

    ctx.body = {
        success: "removed",
    };
});

export default votingRouter;
