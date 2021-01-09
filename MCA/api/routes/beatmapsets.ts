import Router from "koa-router";
import { isLoggedInOsu } from "../../../CorsaceServer/middleware";
import { Beatmapset } from "../../../CorsaceModels/beatmapset";
import { Brackets } from "typeorm";

const beatmapsetsRouter = new Router();

beatmapsetsRouter.get("/search", isLoggedInOsu, async (ctx) => {
    const keywords = ctx.query.keywords;
    const mode = ctx.query.mode;

    const query = Beatmapset
        .createQueryBuilder("beatmapset")
        .leftJoin("beatmapset.beatmaps", "beatmaps");

    if (keywords) {
        query
            .where(new Brackets(q => {
                q
                    .where("beatmapset.creator LIKE :keywords", { keywords: `%${keywords}%` })
                    .orWhere("beatmapset.title LIKE :keywords", { keywords: `%${keywords}%` })
                    .orWhere("beatmapset.artist LIKE :keywords", { keywords: `%${keywords}%` });
            }));
    }

    if (mode) {
        query.andWhere("beatmaps.modeID = :mode", { mode });
    }

    const beatmapsets = await query
        .take(20)
        .getMany();

    ctx.body = beatmapsets;
});

export default beatmapsetsRouter;
