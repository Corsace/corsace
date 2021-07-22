import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { Vote } from "../../../../Models/MCA_AYIM/vote";
import { StaffVote } from "../../../../Interfaces/vote";
import { MoreThan, Not } from "typeorm";

const staffVotesRouter = new Router;

staffVotesRouter.use(isLoggedInDiscord);
staffVotesRouter.use(isStaff);

// Endpoint for getting information for a category
staffVotesRouter.get("/", async (ctx) => {
    let categoryID = ctx.query.category;
    const start = ctx.query.start;
    const maxTake = 101;
    
    if (!categoryID || !/\d+/.test(categoryID))
        return ctx.body = { error: "Invalid category ID given!" };

    if (start && !/\d+/.test(start))
        return ctx.body = { error: "Invalid start index given!" };

    categoryID = parseInt(categoryID);

    const votes = await Vote
        .createQueryBuilder("vote")
        .innerJoin("vote.voter", "voter")
        .innerJoin("vote.category", "category")
        .leftJoin("vote.user", "user")
        .leftJoin("vote.beatmapset", "beatmapset")
        .leftJoin("beatmapset.creator", "creator")
        .leftJoin("beatmapset.beatmaps", "beatmap")
        .select("vote.ID", "ID")
        .addSelect("category.ID", "categoryID")
        .addSelect("vote.choice", "choice")
    // voter selects
        .addSelect("voter.ID", "voterID")
        .addSelect("voter.osuUserid", "voterOsuID")
        .addSelect("voter.osuUsername", "voterOsu")
        .addSelect("voter.discordUsername", "voterDiscord")
    // user selects
        .addSelect("user.osuUserid", "userID")
        .addSelect("user.osuUsername", "userOsu")
        .addSelect("user.discordUsername", "userDiscord")
    // beatmapset selects
        .addSelect("beatmapset.ID", "beatmapsetID")
        .addSelect("beatmapset.artist", "artist")
        .addSelect("beatmapset.title", "title")
        .addSelect("beatmapset.tags", "tags")
        .addSelect("creator.osuUserid", "creatorID")
        .addSelect("creator.osuUsername", "creatorOsu")
        .addSelect("creator.discordUsername", "creatorDiscord")
    // wheres + groups + orders
        .where("category.ID = :id", { id: categoryID })
        .groupBy("vote.ID")
        .orderBy("vote.voterID", "DESC")
        .offset(isNaN(start) ? 0 : start)
        .limit(isNaN(start) ? 0 : maxTake)
        .getRawMany();

    let staffVotes = votes.map(vote => {
        const staffVote = {
            ID: vote.ID,
            category: vote.categoryID,
            choice: vote.choice,
            voter: {
                ID: vote.voterID, 
                osuID: vote.voterOsuID,
                osuUsername: vote.voterOsu,
                discordUsername: vote.voterDiscord,
            },
        } as StaffVote;
        if (vote.userID) {
            staffVote.user = {
                osuID: vote.userID,
                osuUsername: vote.userOsu,
                discordUsername: vote.userDiscord,
            };
        }
        if (vote.beatmapsetID) {
            staffVote.beatmapset = {
                ID: vote.beatmapsetID,
                artist: vote.artist,
                title: vote.title,
                tags: vote.tags,
                creator: {
                    osuID: vote.creatorID,
                    osuUsername: vote.creatorOsu,
                    discordUsername: vote.creatorDiscord,
                },
            };
        }
        return staffVote;
    });

    if (!start) {
        ctx.body = { staffVotes };
        return;
    }

    // ensure data doesn't cut off between voters
    let end = -1;
    let i = staffVotes.length - 1;
    for (; i > 0; --i) {
        if (staffVotes[i].voter.osuID !== staffVotes[i - 1].voter.osuID) {
            end = start + i;
            break;
        }
    }
    staffVotes = staffVotes.slice(0, i === 0 ? undefined : i);

    ctx.body = { staffVotes, nextStart: end };
});

staffVotesRouter.delete("/:id/:user", async (ctx) => {
    const vote = await Vote.findOneOrFail({
        where: {
            ID: ctx.params.id,
            voter: ctx.params.user,
        },
        relations: [
            "category",
        ],
    });

    const otherUserVotes = await Vote.find({
        ID: Not(ctx.params.id),
        voter: ctx.params.user,
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

export default staffVotesRouter;