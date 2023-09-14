import { BeatmapInfo, BeatmapsetInfo } from "../../../Interfaces/beatmap";
import { CategoryType } from "../../../Interfaces/category";
import { StageQuery } from "../../../Interfaces/queries";
import { UserChoiceInfo } from "../../../Interfaces/user";
import { Beatmapset } from "../../../Models/beatmapset";
import { Category } from "../../../Models/MCA_AYIM/category";
import { ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";
import { Nomination } from "../../../Models/MCA_AYIM/nomination";
import { Vote } from "../../../Models/MCA_AYIM/vote";
import { User } from "../../../Models/user";
import { isEligibleFor } from "../../middleware/mca-ayim";
import { parseQueryParam } from "../../utils/query";
import { Beatmap } from "../../../Models/beatmap";
import { osuV2Client } from "../../osu";
import { MCAYearState, ParameterizedContext } from "koa";

export default function mcaSearch (stage: "nominating" | "voting", initialCall: (ctx: ParameterizedContext<MCAYearState>, category: Category) => Promise<Vote[] | Nomination[]>) {
    return async (ctx: ParameterizedContext<MCAYearState>) => {
        if (!ctx.query.category)
            return ctx.body = { success: false, error: "Missing category ID!" };

        // Make sure user is eligible to nominate in this mode
        const modeString: string = parseQueryParam(ctx.query.mode) ?? "standard";
        if (!(modeString in ModeDivisionType)) {
            ctx.body = { success: false, error: "Invalid mode, please use standard, taiko, fruits or mania" };
            return;
        } 
        const modeId = ModeDivisionType[modeString as keyof typeof ModeDivisionType];
        if (!isEligibleFor(ctx.state.user, modeId, ctx.state.year))
            return ctx.body = { success: false, error: "Not eligible for this mode!" };

        let list: BeatmapInfo[] | BeatmapsetInfo[] | UserChoiceInfo[] = [];
        let setList: BeatmapsetInfo[] = [];
        let mapList: BeatmapInfo[] = [];
        let userList: UserChoiceInfo[] = [];
        const favIDs: number[] = [];
        const playedIDs: number[] = [];

        const category = await Category
            .createQueryBuilder("category")
            .innerJoinAndSelect("category.mca", "mca")
            .where("category.ID = :id", { id: ctx.query.category })
            .andWhere("mca.year = :year", { year: ctx.state.year })
            .getOneOrFail();
    
        
        // Check if this is the initial call, add currently nominated beatmaps/users at the top of the list
        const skip = parseInt(parseQueryParam(ctx.query.skip) ?? "") ?? 0;
        if (skip === 0) {
            let objects = await initialCall(ctx, category) as Vote[]; // doesnt really matter the type in this case
            objects = objects.filter(o => o.category.ID === category.ID);

            if (category.type == CategoryType.Beatmapsets && ctx.state.year < 2021)
                setList = objects.map(o => o.beatmapset!.getInfo(true)!);  
            else if (category.type == CategoryType.Beatmapsets && ctx.state.year >= 2021)
                mapList = objects.map(o => o.beatmap!.getInfo(true)!);
            else if (category.type == CategoryType.Users)
                userList = objects.map(o => o.user!.getCondensedInfo(true)!);
        }
        
        if ((ctx.query.favourites === "true" || ctx.query.played === "true") && category.type == CategoryType.Beatmapsets) {
            const accessToken: string = await ctx.state.user.getAccessToken("osu");
            if (ctx.query.favourites === "true") { // Fav filter
                let offset = 0;
                while (true) {
                    const data = await osuV2Client.getFavouriteBeatmaps(ctx.state.user.osu.userID, accessToken, offset);
                    const sets = data.map(set => set.id);

                    favIDs.push(...sets);

                    if (sets.length < 51) break;

                    offset += sets.length;
                }
            }

            if (ctx.query.played === "true") { // Played filter
                let cursorString = "";
                while (true) {
                    const data = await osuV2Client.getPlayedBeatmaps(accessToken, ctx.state.year, cursorString);

                    if (!cursorString && data.beatmapsets.length === 0) break;

                    const sets = data.beatmapsets.map(set => set.id);

                    playedIDs.push(...sets);

                    if (sets.length < 50) break;

                    cursorString = data.cursor_string;
                }
            }

        }

        const order = parseQueryParam(ctx.query.order);
        if (order !== undefined && order !== "ASC" && order !== "DESC")
            return ctx.body = {
                success: false,
                error: "order must be undefined, ASC or DESC",
            };

        let count = 0;
        const query: StageQuery = {
            category: category.ID,
            skip,
            option: parseQueryParam(ctx.query.option) ?? "",
            order,
            text: parseQueryParam(ctx.query.text) ?? "",
            favourites: favIDs,
            played: playedIDs,
        };
    
        if (category.type == CategoryType.Beatmapsets && ctx.state.year < 2021) { // Search for beatmapsets
            const [beatmaps, totalCount] = await Beatmapset.search(ctx.state.year, modeId, stage, category, query);
            
            setList.push(...beatmaps.map(map => map.getInfo()));
            list = setList;
            count = totalCount;
        } else if (category.type == CategoryType.Beatmapsets && ctx.state.year >= 2021) { // Search for beatmaps
            const [beatmaps, totalCount] = await Beatmap.search(ctx.state.year, modeId, stage, category, query);
            
            mapList.push(...beatmaps.map(map => map.getInfo()));
            list = mapList;
            count = totalCount;
        } else if (category.type == CategoryType.Users) { // Search for users
            const [users, totalCount] = await User.search(ctx.state.year, modeString, stage, category, query);
            
            userList.push(...users.map(user => user.getCondensedInfo()));
            list = userList;
            count = totalCount;
        } else
            return ctx.body = { success: false, error: "Invalid type parameter. Only 'beatmapsets' or 'users' are allowed."};
    
        ctx.body = {
            success: true,
            list,
            count,
        };
    };
}
