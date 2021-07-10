import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { Nomination } from "../../../../Models/MCA_AYIM/nomination";
import { StaffNomination } from "../../../../Interfaces/nomination";

const staffNominationsRouter = new Router;

staffNominationsRouter.use(isLoggedInDiscord);
staffNominationsRouter.use(isStaff);

// Endpoint for getting information for a category
staffNominationsRouter.get("/", async (ctx) => {
    let [categoryID, start] = [ctx.query.category, ctx.query.start];
    const maxTake = 101;
    
    if (!categoryID || !/\d+/.test(categoryID))
        return ctx.body = { error: "Invalid category ID given!" };

    if (!start || !/\d+/.test(start))
        return ctx.body = { error: "Invalid start index given!" };

    [categoryID, start] = [parseInt(categoryID), parseInt(start)];

    const nominations = await Nomination
        .createQueryBuilder("nomination")
        .innerJoinAndSelect("nomination.nominators", "nominator")
        .innerJoinAndSelect("nomination.category", "category")
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

    // ensure data doesn't cut off between nominators
    let end = -1;
    let i = staffNominations.length - 1;
    for (; i > 0; --i) {
        if (staffNominations[i].nominator.osuID !== staffNominations[i-1].nominator.osuID) {
            end = start + i;
            break;
        }
    }
    staffNominations = staffNominations.slice(0, i === 0 ? undefined : i);

    ctx.body = { staffNominations, nextStart: end };
});

// Endpoint for accepting a nomination
staffNominationsRouter.post("/:id/update", async (ctx) => {
    let nominationID = ctx.params.id;
    if (!nominationID || !/\d+/.test(nominationID))
        return ctx.body = { error: "Invalid nomination ID given!" };

    nominationID = parseInt(nominationID);
    await Nomination.update(nominationID, {
        isValid: ctx.request.body.isValid,
        reviewer: ctx.state.user,
        lastReviewedAt: new Date,
    });

    ctx.body = {
        isValid: ctx.request.body.isValid,
        reviewer: ctx.state.user.osu.username,
        lastReviewedAt: new Date,
    };
});

export default staffNominationsRouter;
