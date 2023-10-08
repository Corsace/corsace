import { CorsaceRouter } from "../../corsaceRouter";
import { BeatmapResult, BeatmapsetResult, UserResult, votesToResults } from "../../../Interfaces/result";
import { groupVotesByVoters, StaffVote, voteCounter } from "../../../Interfaces/vote";
import { isResults, validatePhaseYear } from "../../../Server/middleware/mca-ayim";
import { Category } from "../../../Models/MCA_AYIM/category";
import { Vote } from "../../../Models/MCA_AYIM/vote";
import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";
import { parseQueryParam } from "../../../Server/utils/query";
import { osuV2Client } from "../../osu";
import { MCAState } from "koa";

const resultsRouter  = new CorsaceRouter<MCAState>();

resultsRouter.use(validatePhaseYear);

resultsRouter.get("/:year?", isResults, async (ctx) => {
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

resultsRouter.get("/:year/search", isResults, async (ctx) => {
    if (await ctx.cashed() && ctx.state.mca.currentPhase() === "results")
        return;

    const categoryIDString = parseQueryParam(ctx.query.category);
    
    if (!categoryIDString || !/\d+/.test(categoryIDString))
        return ctx.body = { error: "Invalid category ID given!" };

    const categoryID = parseInt(categoryIDString);

    const category = await Category
        .createQueryBuilder("category")
        .where("category.ID = :id", { id: categoryID })
        .andWhere("category.mcaYear = :year", { year: ctx.state.mca.year })
        .getOneOrFail();


    let query = Vote
        .createQueryBuilder("vote")
        .innerJoin("vote.voter", "voter")
        .innerJoin("vote.category", "category");
    if (category.type == CategoryType.Beatmapsets && ctx.state.mca.year < 2021) { // beatmapset query
        query = query
            .leftJoin("vote.beatmapset", "beatmapset")
            .leftJoin("beatmapset.creator", "creator")
            .leftJoin("beatmapset.beatmaps", "setmap")
            .select("vote.ID", "ID")
            .addSelect("vote.choice", "choice")
            // voter selects
            .addSelect("voter.osuUserid", "voterOsuID")
            .addSelect("voter.osuUsername", "voterOsu")
            .addSelect("voter.discordUsername", "voterDiscord")
            // beatmapset selects
            .addSelect("beatmapset.ID", "beatmapsetID")
            .addSelect("beatmapset.artist", "artist")
            .addSelect("beatmapset.title", "title")
            .addSelect("beatmapset.tags", "tags")
            .addSelect("creator.osuUserid", "creatorID")
            .addSelect("creator.osuUsername", "creatorOsu")
            .addSelect("creator.discordUsername", "creatorDiscord");
    } else if (category.type == CategoryType.Beatmapsets && ctx.state.mca.year >= 2021) { // 
        query = query
            .leftJoin("vote.beatmap", "beatmap")
            .leftJoin("beatmap.beatmapset", "beatmapset")
            .leftJoin("beatmapset.creator", "creator")
            .select("vote.ID", "ID")
            .addSelect("vote.choice", "choice")
            // voter selects
            .addSelect("voter.osuUserid", "voterOsuID")
            .addSelect("voter.osuUsername", "voterOsu")
            .addSelect("voter.discordUsername", "voterDiscord")
            // beatmap selects
            .addSelect("beatmap.ID", "beatmapID")
            .addSelect("beatmap.difficulty", "difficulty")
            // beatmapset selects
            .addSelect("beatmapset.ID", "beatmapsetID")
            .addSelect("beatmapset.artist", "artist")
            .addSelect("beatmapset.title", "title")
            .addSelect("beatmapset.tags", "tags")
            .addSelect("creator.osuUserid", "creatorID")
            .addSelect("creator.osuUsername", "creatorOsu")
            .addSelect("creator.discordUsername", "creatorDiscord");
    } else {
        query = query
            .leftJoin("vote.user", "user")
            .select("vote.ID", "ID")
            .addSelect("vote.choice", "choice")
            // voter selects
            .addSelect("voter.osuUserid", "voterOsuID")
            .addSelect("voter.osuUsername", "voterOsu")
            .addSelect("voter.discordUsername", "voterDiscord")
            // user selects
            .addSelect("user.osuUserid", "userID")
            .addSelect("user.osuUsername", "userOsu")
            .addSelect("user.discordUsername", "userDiscord");
    }

    const votes = await query
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
        if (vote.beatmapID)
            staffVote.beatmap = {
                ID: vote.beatmapID,
                difficulty: vote.difficulty,
            };
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
    const resultVotes = voteCounter(groupVotesByVoters(staffVotes), ctx.state.mca.year);
    let results = votesToResults(resultVotes, category.type);
    if ((ctx.query.favourites === "true" || ctx.query.played === "true") && category.type == CategoryType.Beatmapsets && ctx.state.user) {
        const accessToken: string = await ctx.state.user.getAccessToken("osu");
        let ids: number[] = [];
        if (ctx.query.favourites === "true") { // Fav filter
            let offset = 0;
            while (true) {
                const data = await osuV2Client.getFavouriteBeatmaps(ctx.state.user.osu.userID, accessToken, offset);
                const sets = data.map(set => set.id);

                ids.push(...sets);

                if (sets.length < 51) break;

                offset += sets.length;
            }
        }

        if (ctx.query.played === "true") { // Played filter
            let cursorString = "";
            while (true) {
                const data = await osuV2Client.getPlayedBeatmaps(accessToken, ctx.state.year, cursorString);

                if (!cursorString && data.beatmapsets.length === 0) break;

                let sets: any;
                if (ctx.state.mca.year < 2021)
                    sets = data.beatmapsets.map(set => set.id);
                else
                    sets = data.beatmapsets.map(set => set.beatmaps.map(map => map.id)).flat();

                ids.push(...sets);

                if (data.beatmapsets.map(set => set.id).length < 50) break;

                cursorString = data.cursor_string;
            }
        }
        ids = ids.filter((val, i, self) => self.findIndex(v => v === val) === i);
        if (ctx.state.mca.year < 2021)
            results = (results as BeatmapsetResult[]).filter(result => ids.some(id => result.id === id));
        else
            results = (results as BeatmapResult[]).filter(result => ids.some(id => result.id === id));
    }
    if (ctx.query.text) {
        const text: string = parseQueryParam(ctx.query.text)!.toLowerCase();
        if (category.type === CategoryType.Beatmapsets && ctx.state.mca.year < 2021)
            results = (results as BeatmapsetResult[]).filter(result => result.artist.toLowerCase().includes(text) || result.title.toLowerCase().includes(text) || result.hoster.toLowerCase().includes(text) || result.id.toString().toLowerCase().includes(text));
        else if (category.type === CategoryType.Beatmapsets && ctx.state.mca.year >= 2021)
            results = (results as BeatmapResult[]).filter(result => result.artist.toLowerCase().includes(text) || result.title.toLowerCase().includes(text) || result.hoster.toLowerCase().includes(text) || result.id.toString().toLowerCase().includes(text));
        else if (category.type === CategoryType.Users)
            results = (results as UserResult[]).filter(result => result.username.toLowerCase().includes(text) || result.userID.toLowerCase().includes(text));
    }
    ctx.body = {
        list: results,
    };
});

export default resultsRouter;