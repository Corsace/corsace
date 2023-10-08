import { CorsaceRouter } from "../../corsaceRouter";
import { config } from "node-config-ts";
import { CategoryCondensedInfo } from "../../../Interfaces/category";
import { ModeDivisionType } from "../../../Interfaces/modes";
import { Beatmapset } from "../../../Models/beatmapset";
import { Category } from "../../../Models/MCA_AYIM/category";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { discordGuild } from "../../discord";
import { parseQueryParam } from "../../utils/query";
import { MCAFrontData, MCAInfo } from "../../../Interfaces/mca";

const mcaRouter  = new CorsaceRouter();
const modeStaff = config.discord.roles.mca;

mcaRouter.$get<{ mca: MCAInfo }>("/", async (ctx) => {
    if (await ctx.cashed())
        return;

    const param = parseQueryParam(ctx.query.year);
    if (!param) {
        ctx.body = {
            success: false,
            error: "No year specified!",
        };
        return;
    }
    const year = parseInt(param);
    if (isNaN(year)) {
        ctx.body = {
            success: false,
            error: "Invalid year specified!",
        };
        return;
    }

    const mca = await MCA.findOne({
        where: {
            year,
        },
    });

    if (mca)
        ctx.body = {
            success: true,
            mca: mca.getInfo(),
        };
    else
        ctx.body = {
            success: false,
            error: "No MCA for this year exists!",
        };
});

mcaRouter.$get<{ mca: MCAInfo[] }>("/all", async (ctx) => {
    const mca = await MCA.find();
    const mcaInfo = mca.map(x => x.getInfo());

    ctx.body = {
        success: true,
        mca: mcaInfo,
    };
});

mcaRouter.$get<{ frontData: MCAFrontData }>("/front", async (ctx) => {
    if (await ctx.cashed())
        return;

    const mca = ctx.query.year ? await MCA.findOne({ where: { year: parseInt(parseQueryParam(ctx.query.year)!.toString(), 10) }}) : null;

    if (!mca)
        return ctx.body = {
            success: false,
            error: "There is no MCA for this year currently!",
        };

    const frontData: MCAFrontData = {
        standard: undefined,
        taiko: undefined,
        fruits: undefined,
        mania: undefined,
        storyboard: undefined,
    };

    const modes = await ModeDivision.find();
    await Promise.all(modes.map(mode => (async () => {
        const modeName: keyof typeof ModeDivisionType = mode.name as keyof typeof ModeDivisionType;

        const beatmapCounter = Beatmapset
            .createQueryBuilder("beatmapset")
            .innerJoinAndSelect("beatmapset.beatmaps", "beatmap", mode.ID === 5 ? "beatmap.storyboard = :q" : "beatmap.mode = :q", { q: mode.ID === 5 ? true : mode.ID })
            .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: `${mca.year}-01-01`, end: `${mca.year + 1}-01-01` })
            .getCount();

        const [categories, beatmapCount, organizers] = await Promise.all([
            Category.find({ 
                where: {
                    mca: {
                        year: mca.year,
                    },
                    mode: {
                        ID: mode.ID,
                    },
                },
            }), 
            beatmapCounter,
            (await discordGuild()).members.cache.filter(x => x.roles.cache.has(modeStaff[modeName])).map(x => x.nickname ?? x.user.username),
        ]);

        const categoryInfos = categories.map(x => x.getCondensedInfo());

        frontData[modeName] = {
            categoryInfos,
            beatmapCount,
            organizers,
        };
    })()));

    ctx.body = {
        success: true,
        frontData,
    };
});

export default mcaRouter;
