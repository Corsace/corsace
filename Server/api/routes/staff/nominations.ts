import { CorsaceRouter } from "../../../corsaceRouter";
import { isLoggedInDiscord } from "../../../../Server/middleware";
import { Nomination } from "../../../../Models/MCA_AYIM/nomination";
import { StaffNomination } from "../../../../Interfaces/nomination";
import { parseQueryParam } from "../../../../Server/utils/query";
import { UserAuthenticatedState } from "koa";
import { isMCAStaff } from "../../../middleware/mca-ayim";

const staffNominationsRouter  = new CorsaceRouter<UserAuthenticatedState>();

staffNominationsRouter.$use(isLoggedInDiscord);
staffNominationsRouter.$use(isMCAStaff);

// Endpoint for getting information for a category
staffNominationsRouter.$get<{ staffNominations: StaffNomination[] }>("/", async (ctx) => {
    const categoryIDString = parseQueryParam(ctx.query.category);
    
    if (!categoryIDString || !/\d+/.test(categoryIDString)) {
        ctx.body = { 
            success: false,
            error: "Invalid category ID given!",
        };
        return;
    }

    const categoryID = parseInt(categoryIDString);

    const nominations = await Nomination
        .createQueryBuilder("nomination")
        .innerJoinAndSelect("nomination.category", "category")
        .leftJoinAndSelect("nomination.nominators", "nominator")
        .leftJoinAndSelect("nomination.reviewer", "reviewer")
        .leftJoinAndSelect("nomination.user", "user")
        .leftJoinAndSelect("nomination.beatmapset", "beatmapset")
        .leftJoinAndSelect("beatmapset.creator", "creator")
        .leftJoinAndSelect("beatmapset.beatmaps", "beatmapsetBeatmap")
        .leftJoinAndSelect("nomination.beatmap", "beatmap")
        .leftJoinAndSelect("beatmap.beatmapset", "beatmapBeatmapset")
        .leftJoinAndSelect("beatmapBeatmapset.creator", "beatmapsetCreator")
        .andWhere("category.ID = :id", { id: categoryID })
        .orderBy("nomination.isValid", "ASC")
        .addOrderBy("nomination.reviewerID", "ASC")
        .getMany();

    const staffNominations = nominations.map(nom => {
        const staffNom: StaffNomination = {
            ID: nom.ID,
            categoryId: nom.category.ID,
            isValid: nom.isValid === true,
            reviewer: nom.reviewer?.osu.username ?? "",
            lastReviewedAt: nom.lastReviewedAt,
            nominators: nom.nominators.map(n => ({
                osuID: n.osu.userID,
                osuUsername: n.osu.username,
                discordUsername: n.discord.username,
            })),
        };
        if (nom.user) {
            staffNom.user = {
                osuID: nom.user.osu.userID,
                osuUsername: nom.user.osu.username,
                discordUsername: nom.user.discord.username,
            };
        }
        if (nom.beatmapset) {
            staffNom.beatmapset = {
                ID: nom.beatmapset.ID,
                artist: nom.beatmapset.artist,
                title: nom.beatmapset.title,
                tags: nom.beatmapset.tags,
                BPM: nom.beatmapset.BPM,
                length: Math.max(...nom.beatmapset.beatmaps.map(b => b.hitLength)),
                maxSR: Math.max(...nom.beatmapset.beatmaps.map(b => b.totalSR)),
                creator: {
                    osuID: nom.beatmapset.creator.osu.userID,
                    osuUsername: nom.beatmapset.creator.osu.username,
                    discordUsername: nom.beatmapset.creator.discord.username,
                },
            };
        }
        if (nom.beatmap) {
            staffNom.beatmap = {
                ID: nom.beatmap.ID,
                difficulty: nom.beatmap.difficulty,
            };
            staffNom.beatmapset = {
                ID: nom.beatmap.beatmapsetID,
                artist: nom.beatmap.beatmapset.artist,
                title: nom.beatmap.beatmapset.title,
                tags: nom.beatmap.beatmapset.tags,
                BPM: nom.beatmap.beatmapset.BPM,
                length: nom.beatmap.hitLength,
                maxSR: nom.beatmap.totalSR,
                creator: {
                    osuID: nom.beatmap.beatmapset.creator.osu.userID,
                    osuUsername: nom.beatmap.beatmapset.creator.osu.username,
                    discordUsername: nom.beatmap.beatmapset.creator.discord.username,
                },
            };
        }
        return staffNom;
    });

    ctx.body = {
        success: true,
        staffNominations,
    };
});

// Endpoint for accepting a nomination
staffNominationsRouter.$post<{
    isValid: boolean;
    reviewer: string;
    lastReviewedAt: Date;
}>("/:id/update", async (ctx) => {
    const nominationID = ctx.params.id;
    if (!nominationID || !/\d+/.test(nominationID)) {
        ctx.body = { 
            success: false,
            error: "Invalid nomination ID given!",
        };
        return;
    }

    const nomination = await Nomination.findOneOrFail({
        where: {
            ID: parseInt(nominationID, 10),
        },
    });
    nomination.isValid = ctx.request.body.isValid; 
    nomination.reviewer = ctx.state.user;
    nomination.lastReviewedAt = new Date();
    if (!nomination.isValid)
        nomination.nominators = [];
    await nomination.save();

    ctx.body = {
        success: true,
        isValid: ctx.request.body.isValid,
        reviewer: ctx.state.user.osu.username,
        lastReviewedAt: new Date(),
    };
});

// Endpoint for deleting a nomination
staffNominationsRouter.$delete("/:id", async (ctx) => {
    const nominationID = ctx.params.id;
    if (!nominationID || !/\d+/.test(nominationID))
        return ctx.body = {
            success: false, 
            error: "Invalid nomination ID given!",
        };

    const nomination = await Nomination.findOneOrFail({
        where: {
            ID: parseInt(nominationID, 10),
        },
    });
    await nomination.remove();

    ctx.body = {
        success: true,
    };
});

export default staffNominationsRouter;
