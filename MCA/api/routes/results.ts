import Axios from "axios";
import Router from "@koa/router";
import { BeatmapResult, UserResult, votesToResults } from "../../../Interfaces/result";
import { groupVotesByVoters, StaffVote, voteCounter } from "../../../Interfaces/vote";
import { isResults, validatePhaseYear } from "../../../MCA-AYIM/api/middleware";
import { Category } from "../../../Models/MCA_AYIM/category";
import { Vote } from "../../../Models/MCA_AYIM/vote";
import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";

const resultsRouter = new Router();

resultsRouter.get("/:year?", validatePhaseYear, isResults, async (ctx) => {
    const categories = await Category.find({
        where: {
            mca: {
                year: ctx.state.year,
            },
        },
    });

    const categoryInfos: CategoryStageInfo[] = categories.map(c => c.getInfo() as CategoryStageInfo);

    ctx.body = {
        categories: categoryInfos,
    };
});

resultsRouter.get("/:year/search", validatePhaseYear, isResults, async (ctx) => {
    if (await ctx.cashed() && ctx.state.mca.currentPhase() === "results")
        return;

    let categoryID = ctx.query.category;
    
    if (!categoryID || !/\d+/.test(categoryID))
        return ctx.body = { error: "Invalid category ID given!" };

    categoryID = parseInt(categoryID);

    const category = await Category
        .createQueryBuilder("category")
        .where("category.ID = :id", { id: categoryID })
        .andWhere("category.mcaYear = :year", { year: ctx.state.mca.year })
        .getOneOrFail();

    const votes = await Vote
        .createQueryBuilder("vote")
        .innerJoin("vote.voter", "voter")
        .innerJoin("vote.category", "category")
        .leftJoin("vote.user", "user")
        .leftJoin("vote.beatmapset", "beatmapset")
        .leftJoin("beatmapset.creator", "creator")
        .leftJoin("beatmapset.beatmaps", "beatmap")
        .select("vote.ID", "ID")
        .addSelect("vote.choice", "choice")
    // voter selects
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
        .andWhere("category.mcaYear = :year", { year: ctx.state.mca.year })
        .groupBy("vote.ID")
        .orderBy("vote.voterID", "DESC")
        .getRawMany();

    const staffVotes = votes.map(vote => {
        const staffVote = {
            ID: vote.ID,
            choice: vote.choice,
            voter: {
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
    const resultVotes = voteCounter(groupVotesByVoters(staffVotes));
    let results = votesToResults(resultVotes, category.type);
    if ((ctx.query.favourites === "true" || ctx.query.played === "true") && category.type == CategoryType.Beatmapsets && ctx.state.user) {
        const accessToken: string = await ctx.state.user.getAccessToken("osu");
        let ids: number[] = [];
        if (ctx.query.favourites === "true") { // Fav filter
            let offset = 0;
            for (;;) {
                const res = await Axios.get(`https://osu.ppy.sh/api/v2/users/${ctx.state.user.osu.userID}/beatmapsets/favourite?limit=51&offset=${offset}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const sets = res.data.map(set => set.id);

                ids.push(...sets);

                if (sets.length < 51) break;

                offset += sets.length;
            }
        }

        if (ctx.query.played === "true") { // Played filter
            let approvedDate = "";
            let _id = "";
            for (;;) {
                let url = `https://osu.ppy.sh/api/v2/beatmapsets/search?played=played&q=ranked%3D${ctx.state.year}`;
                if (approvedDate) url += `&cursor%5Bapproved_date%5D=${approvedDate}&cursor%5B_id%5D=${_id}`;
                const res = await Axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!approvedDate && res.data.beatmapsets.length === 0) break;

                const sets = res.data.beatmapsets.map(set => set.id);

                ids.push(...sets);

                if (sets.length < 50) break;

                approvedDate = res.data.cursor.approved_date;
                _id = res.data.cursor._id;
            }
        }
        ids = ids.filter((val, i, self) => self.findIndex(v => v === val) === i);
        results = (results as BeatmapResult[]).filter(result => ids.some(id => result.id === id));
    }
    if (ctx.query.text) {
        const text: string = ctx.query.text.toLowerCase();
        if (category.type === CategoryType.Beatmapsets)
            results = (results as BeatmapResult[]).filter(result => result.artist.toLowerCase().includes(text) || result.title.toLowerCase().includes(text) || result.hoster.toLowerCase().includes(text) || result.id.toString().toLowerCase().includes(text));
        else if (category.type === CategoryType.Users)
            results = (results as UserResult[]).filter(result => result.username.toLowerCase().includes(text) || result.userID.toLowerCase().includes(text));
    }
    ctx.body = {
        list: results,
    };
});

export default resultsRouter;