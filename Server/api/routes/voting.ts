import { MCAYearState, UserAuthenticatedState } from "koa";
import { CorsaceRouter } from "../../corsaceRouter";
import { isLoggedIn } from "../../../Server/middleware";
import { isEligible, isEligibleFor, isPhaseStarted, validatePhaseYear, isPhase } from "../../../Server/middleware/mca-ayim";
import { Vote } from "../../../Models/MCA_AYIM/vote";
import { Category } from "../../../Models/MCA_AYIM/category";
import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";
import mcaSearch from "./mcaSearch";
import { Beatmapset } from "../../../Models/beatmapset";
import { User } from "../../../Models/user";
import { MoreThan, Not } from "typeorm";
import { Nomination } from "../../../Models/MCA_AYIM/nomination";
import { Beatmap } from "../../../Models/beatmap";
import { MCAStageData } from "../../../Interfaces/mca";

const votingRouter  = new CorsaceRouter<UserAuthenticatedState>();

votingRouter.$use(isLoggedIn);

votingRouter.$get<MCAStageData>("/:year?", validatePhaseYear, isPhaseStarted("voting"), async (ctx) => {
    const [votes, categories] = await Promise.all([
        Vote.find({
            where: {
                voter: {
                    ID: ctx.state.user.ID,
                },
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
        success: true,
        votes: filteredVotes,
        categories: categoryInfos,
    };
});

votingRouter.$get("/:year?/search", validatePhaseYear, isPhaseStarted("voting"), mcaSearch("voting", async (ctx, category) => {
    let votes = await Vote.find({
        where: {
            voter: {
                ID: ctx.state.user.ID,
            },
        },
        relations: ["user", "beatmapset", "beatmap", "beatmap.beatmapset", "beatmap.beatmapset.creator"],
    });
    votes = votes.filter(vote => vote.category.mca.year === category.mca.year).sort((a, b) => a.choice - b.choice);

    return votes;
}));

votingRouter.$post<{ vote: Vote }, MCAYearState>("/:year?/create", validatePhaseYear, isPhase("voting"), isEligible, async (ctx) => {
    const nomineeId = ctx.request.body.nomineeId;
    const categoryId = ctx.request.body.category;
    const choice = ctx.request.body.choice;

    const category = await Category.findOneOrFail({ where: { ID: categoryId }});
    
    if (choice < 1 || choice > 100) {
        return ctx.body = {
            success: false,
            error: "Invalid choice",
        };
    }

    const nomQ = Nomination
        .createQueryBuilder("nomination")
        .where(`categoryID = ${category.ID}`);

    if (category.type === CategoryType.Beatmapsets && ctx.state.year < 2021) {
        nomQ.andWhere(`beatmapsetID = ${nomineeId}`);
    } else if (category.type === CategoryType.Beatmapsets && ctx.state.year >= 2021) {
        nomQ.andWhere(`beatmapID = ${nomineeId}`);
    } else {
        nomQ.andWhere(`userID = ${nomineeId}`);
    }

    const exists = await nomQ.getRawOne();
    if (!exists) {
        return ctx.body = {
            success: false,
            error: `It wasn't nominated :(`,
        };
    }
    
    if (!isEligibleFor(ctx.state.user, category.mode.ID, ctx.state.year)) {
        return ctx.body = {
            success: false,
            error: "You weren't active for this mode",
        };
    }

    let votes = await Vote.find({
        where: {
            voter: {
                ID: ctx.state.user.ID,
            },
        },
    });
    votes = votes.filter(vote => vote.category.mca.year === category.mca.year);

    const categoryVotes = votes.filter(vote => vote.category.ID === category.ID);

    if (categoryVotes.some(v => v.choice === choice)) {
        return ctx.body = {
            success: false,
            error: `Already voted: ${choice}`,
        };
    }

    let alreadyVoted = false;

    const vote = new Vote();
    vote.voter = ctx.state.user;
    vote.category = category;
    
    if (category.type === CategoryType.Beatmapsets && ctx.state.year < 2021) {
        const nominee = await Beatmapset.findOneOrFail({ where: { ID: nomineeId }});
        vote.beatmapset = nominee;

        if (categoryVotes.some(v => v.beatmapset?.ID == nominee.ID)) {
            alreadyVoted = true;
        }
    } else if (category.type === CategoryType.Beatmapsets && ctx.state.year >= 2021) {
        const nominee = await Beatmap.findOneOrFail({ where: { ID: nomineeId }});
        vote.beatmap = nominee;

        if (categoryVotes.some(v => v.beatmap?.ID == nominee.ID)) {
            alreadyVoted = true;
        }
    } else if (category.type === CategoryType.Users) {
        const nominee = await User.findOneOrFail({ where: { ID: nomineeId }});
        vote.user = nominee;
        
        if (categoryVotes.some(v => v.user?.ID == nominee.ID)) {
            alreadyVoted = true;
        }
    }
    
    if (alreadyVoted) {
        return ctx.body = {
            success: false,
            error: "Already voted for this",
        };
    }

    vote.choice = choice;
    await vote.save();

    ctx.body = {
        success: true,
        vote,
    };
});

votingRouter.$delete("/:id", validatePhaseYear, isPhase("voting"), isEligible, async (ctx) => {
    const vote = await Vote.findOneOrFail({
        where: {
            ID: parseInt(ctx.params.id, 10),
            voter: {
                ID: ctx.state.user.ID,
            },
        },
        relations: [
            "category",
        ],
    });

    const otherUserVotes = await Vote.find({
        where: {
            ID: Not(parseInt(ctx.params.id, 10)),
            voter: {
                ID: ctx.state.user.ID,
            },
            category: {
                ID: vote.category.ID,
            },
            choice: MoreThan(vote.choice),
        },
    });

    await vote.remove();
    await Promise.all([
        otherUserVotes.map(v => {
            v.choice--;
            return v.save();
        }),
    ]);

    ctx.body = {
        success: true,
    };
});

votingRouter.$post<object, MCAYearState>("/swap", validatePhaseYear, isPhase("voting"), isEligible, async (ctx) => {
    const votesInput: Vote[] = ctx.request.body;
    const year = ctx.state.year;
    
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
        success: true,
    };
});

export default votingRouter;
