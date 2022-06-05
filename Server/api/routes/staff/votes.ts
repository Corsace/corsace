import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { Vote } from "../../../../Models/MCA_AYIM/vote";
import { StaffVote } from "../../../../Interfaces/vote";
import { MoreThan, Not } from "typeorm";
import { parseQueryParam } from "../../../../Server/utils/query";

const staffVotesRouter = new Router;

staffVotesRouter.use(isLoggedInDiscord);
staffVotesRouter.use(isStaff);

// Endpoint for getting information for a category
staffVotesRouter.get("/", async (ctx) => {
    const categoryIDString = parseQueryParam(ctx.query.category);
    
    if (!categoryIDString || !/\d+/.test(categoryIDString))
        return ctx.body = { error: "Invalid category ID given!" };

    const categoryID = parseInt(categoryIDString);

    const votes = await Vote
        .createQueryBuilder("vote")
        .innerJoin("vote.voter", "voter")
        .innerJoin("vote.category", "category")
        .leftJoin("vote.user", "user")
        .leftJoin("vote.beatmapset", "beatmapset")
        .leftJoin("beatmapset.creator", "creator")
        .leftJoin("vote.beatmap", "beatmap")
        .leftJoin("beatmap.beatmapset", "beatmapBeatmapset")
        .leftJoin("beatmapBeatmapset.creator", "beatmapsetCreator")
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
    // beatmap selects
        .addSelect("beatmap.ID", "beatmapID")
        .addSelect("beatmap.difficulty", "difficulty")
        .addSelect("beatmapBeatmapset.ID", "beatmapBeatmapsetID")
        .addSelect("beatmapBeatmapset.artist", "beatmapBeatmapsetArtist")
        .addSelect("beatmapBeatmapset.title", "beatmapBeatmapsetTitle")
        .addSelect("beatmapBeatmapset.tags", "beatmapBeatmapsetTags")
        .addSelect("beatmapsetCreator.osuUserid", "beatmapsetCreatorID")
        .addSelect("beatmapsetCreator.osuUsername", "beatmapsetCreatorOsu")
        .addSelect("beatmapsetCreator.discordUsername", "beatmapsetCreatorDiscord")
    // wheres + groups + orders
        .where("category.ID = :id", { id: categoryID })
        .groupBy("vote.ID")
        .orderBy("vote.voterID", "DESC")
        .getRawMany();

    const staffVotes = votes.map(vote => {
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
        if (vote.beatmapID) {
            staffVote.beatmap = {
                ID: vote.beatmapID,
                difficulty: vote.difficulty, 
            };
            staffVote.beatmapset = {
                ID: vote.beatmapBeatmapsetID,
                artist: vote.beatmapBeatmapsetArtist,
                title: vote.beatmapBeatmapsetTitle,
                tags: vote.beatmapBeatmapsetTags,
                creator: {
                    osuID: vote.beatmapsetCreatorID,
                    osuUsername: vote.beatmapsetCreatorOsu,
                    discordUsername: vote.beatmapsetCreatorDiscord,
                },
            };
        }
        return staffVote;
    });

    ctx.body = staffVotes;
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
        where: {
            ID: Not(ctx.params.id),
            voter: ctx.params.user,
            category: vote.category,
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
        success: "removed",
    };
});

export default staffVotesRouter;