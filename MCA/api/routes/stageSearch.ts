import Axios from "axios";
import { ParameterizedContext } from "koa";
import { BeatmapsetInfo } from "../../../Interfaces/beatmap";
import { CategoryType } from "../../../Interfaces/category";
import { StageQuery } from "../../../Interfaces/queries";
import { UserChoiceInfo } from "../../../Interfaces/user";
import { Beatmapset } from "../../../Models/beatmapset";
import { Category } from "../../../Models/MCA_AYIM/category";
import { ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";
import { Nomination } from "../../../Models/MCA_AYIM/nomination";
import { Vote } from "../../../Models/MCA_AYIM/vote";
import { User } from "../../../Models/user";
import { isEligibleFor } from "../../../MCA-AYIM/api/middleware";

export default function stageSearch (stage: "nominating" | "voting", initialCall: (ctx: ParameterizedContext, category: Category) => Promise<Vote[] | Nomination[]>) {
    return async (ctx: ParameterizedContext) => {
        if (!ctx.query.category)
            return ctx.body = {
                error: "Missing category ID!",
            };

        let list: BeatmapsetInfo[] | UserChoiceInfo[] = [];
        let setList: BeatmapsetInfo[] = [];
        let userList: UserChoiceInfo[] = [];
        const favIDs: number[] = [];
        const playedIDs: number[] = [];

        const category = await Category
            .createQueryBuilder("category")
            .innerJoinAndSelect("category.mca", "mca")
            .where("category.ID = :id", { id: ctx.query.category })
            .andWhere("mca.year = :year", { year: ctx.state.year })
            .getOneOrFail();
    
        // Obtain mode and amount to skip
        const modeString: string = ctx.query.mode || "standard";
        const modeId = ModeDivisionType[modeString];
    
        let skip = 0;
        if (/\d+/.test(ctx.query.skip))
            skip = parseInt(ctx.query.skip);
        
        // Check if this is the initial call, add currently nominated beatmaps/users at the top of the list
        if (skip === 0) {
            let objects = await initialCall(ctx, category) as Vote[]; // doesnt really matter the type in this case
            objects = objects.filter(o => o.category.ID === category.ID);

            if (category.type == CategoryType.Beatmapsets)
                setList = objects.map(o => o.beatmapset?.getInfo(true) as BeatmapsetInfo);  
            else if (category.type == CategoryType.Users)
                userList = objects.map(o => o.user?.getCondensedInfo(true) as UserChoiceInfo);
        }
        
        // Make sure user is eligible to nominate in this mode
        if (!isEligibleFor(ctx.state.user, modeId, ctx.state.year))
            return ctx.body = { error: "Not eligible for this mode!" };
        
        if ((ctx.query.favourites === "true" || ctx.query.played === "true") && category.type == CategoryType.Beatmapsets) {
            const accessToken: string = await ctx.state.user.getAccessToken("osu");
            if (ctx.query.favourites === "true") { // Fav filter
                let offset = 0;
                for (;;) {
                    const res = await Axios.get(`https://osu.ppy.sh/api/v2/users/${ctx.state.user.osu.userID}/beatmapsets/favourite?limit=51&offset=${offset}`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                    const sets = res.data.map(set => set.id);

                    favIDs.push(...sets);

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

                    playedIDs.push(...sets);

                    if (sets.length < 50) break;

                    approvedDate = res.data.cursor.approved_date;
                    _id = res.data.cursor._id;
                }
            }

        }

        let count = 0;
        const query: StageQuery = {
            category: category.ID,
            skip,
            option: ctx.query.option,
            order: ctx.query.order,
            text: ctx.query.text,
            favourites: favIDs,
            played: playedIDs,
        };
    
        if (category.type == CategoryType.Beatmapsets) { // Search for beatmaps
            const [beatmaps, totalCount] = await Beatmapset.search(ctx.state.year, modeId, stage, category, query);
            
            setList.push(...beatmaps.map(map => map.getInfo()));
            list = setList;
            count = totalCount;
        } else if (category.type == CategoryType.Users) { // Search for users
            const [users, totalCount] = await User.search(ctx.state.year, modeString, stage, category, query);
            
            userList.push(...users.map(user => user.getCondensedInfo()));
            list = userList;
            count = totalCount;
        } else
            return ctx.body = { error: "Invalid type parameter. Only 'beatmapsets' or 'users' are allowed."};
    
        ctx.body = {
            list,
            count,
        };
    };
}
