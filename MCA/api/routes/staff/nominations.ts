import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { Nomination } from "../../../../Models/MCA_AYIM/nomination";
import { StaffNomination } from "../../../../Interfaces/nomination";
import { parseQueryParam } from "../../../../Server/utils/query";

const staffNominationsRouter = new Router;

staffNominationsRouter.use(isLoggedInDiscord);
staffNominationsRouter.use(isStaff);

// Endpoint for getting information for a category
staffNominationsRouter.get("/", async (ctx) => {
    const categoryIDString = parseQueryParam(ctx.query.category);
    
    if (!categoryIDString || !/\d+/.test(categoryIDString))
        return ctx.body = { error: "Invalid category ID given!" };

    const categoryID = parseInt(categoryIDString);

    const nominations = await Nomination
        .createQueryBuilder("nomination")
        .innerJoinAndSelect("nomination.category", "category")
        .leftJoinAndSelect("nomination.nominators", "nominator")
        .leftJoinAndSelect("nomination.reviewer", "reviewer")
        .leftJoinAndSelect("nomination.user", "user")
        .leftJoinAndSelect("nomination.beatmapset", "beatmapset")
        .leftJoinAndSelect("beatmapset.creator", "creator")
        .leftJoinAndSelect("beatmapset.beatmaps", "beatmap")
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
        return staffNom;
    });

    ctx.body = staffNominations;
});

// Endpoint for accepting a nomination
staffNominationsRouter.post("/:id/update", async (ctx) => {
    const nominationID = ctx.params.id;
    if (!nominationID || !/\d+/.test(nominationID))
        return ctx.body = { error: "Invalid nomination ID given!" };

    const nomination = await Nomination.findOneOrFail({
        ID: parseInt(nominationID),
    });
    nomination.isValid = ctx.request.body.isValid; 
    nomination.reviewer = ctx.state.user;
    nomination.lastReviewedAt = new Date;
    if (!nomination.isValid)
        nomination.nominators = [];
    await nomination.save();

    ctx.body = {
        isValid: ctx.request.body.isValid,
        reviewer: ctx.state.user.osu.username,
        lastReviewedAt: new Date,
    };
});

// Endpoint for deleting a nomination
staffNominationsRouter.delete("/:id", async (ctx) => {
    const nominationID = ctx.params.id;
    if (!nominationID || !/\d+/.test(nominationID))
        return ctx.body = { error: "Invalid nomination ID given!" };

    const nomination = await Nomination.findOneOrFail({
        ID: parseInt(nominationID),
    });
    await nomination.remove();

    ctx.body = {
        status: "success",
    };
});

export default staffNominationsRouter;
