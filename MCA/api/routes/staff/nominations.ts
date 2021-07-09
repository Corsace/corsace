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
                                .innerJoin("nomination.nominator", "nominator")
                                .innerJoin("nomination.category", "category")
                                .leftJoin("nomination.reviewer", "reviewer")
                                .leftJoin("nomination.user", "user")
                                .leftJoin("nomination.beatmapset", "beatmapset")
                                .leftJoin("beatmapset.creator", "creator")
                                .leftJoin("beatmapset.beatmaps", "beatmap")
                                .select("nomination.ID", "ID")
                                .addSelect("category.ID", "categoryID")
                                .addSelect("nomination.isValid", "isValid")
                                .addSelect("reviewer.osuUsername", "reviewerOsu")
                                .addSelect("nomination.lastReviewedAt", "lastReviewedAt")
                                // nominator selects
                                .addSelect("nominator.osuUserid", "nominatorID")
                                .addSelect("nominator.osuUsername", "nominatorOsu")
                                .addSelect("nominator.discordUsername", "nominatorDiscord")
                                // user selects
                                .addSelect("user.osuUserid", "userID")
                                .addSelect("user.osuUsername", "userOsu")
                                .addSelect("user.discordUsername", "userDiscord")
                                // beatmapset selects
                                .addSelect("beatmapset.ID", "beatmapsetID")
                                .addSelect("beatmapset.artist", "artist")
                                .addSelect("beatmapset.title", "title")
                                .addSelect("beatmapset.tags", "tags")
                                .addSelect("beatmapset.BPM", "BPM")
                                .addSelect("MAX(beatmap.hitLength)", "length")
                                .addSelect("MAX(beatmap.totalSR)", "maxSR")
                                .addSelect("creator.osuUserid", "creatorID")
                                .addSelect("creator.osuUsername", "creatorOsu")
                                .addSelect("creator.discordUsername", "creatorDiscord")
                                // wheres + groups + orders
                                .andWhere("category.ID = :id", { id: categoryID })
                                .groupBy("nomination.ID")
                                .orderBy("nomination.nominatorID", "DESC")
                                .addOrderBy("nomination.isValid", "ASC")
                                .addOrderBy("nomination.reviewerID", "ASC")
                                .offset(start)
                                .limit(maxTake)
                                .getRawMany();

    let staffNominations = nominations.map(nom => {
        let staffNom = {
            ID: nom.ID,
            category: nom.categoryID,
            isValid: nom.isValid === 1,
            reviewer: nom.reviewerOsu ?? "",
            lastReviewedAt: nom.lastReviewedAt,
            nominator: {
                osuID: nom.nominatorID,
                osuUsername: nom.nominatorOsu,
                discordUsername: nom.nominatorDiscord,
            },
        } as StaffNomination;
        if (nom.userID) {
            staffNom.user = {
                osuID: nom.userID,
                osuUsername: nom.userOsu,
                discordUsername: nom.userDiscord,
            }
        }
        if (nom.beatmapsetID) {
            staffNom.beatmapset = {
                ID: nom.beatmapsetID,
                artist: nom.artist,
                title: nom.title,
                tags: nom.tags,
                BPM: nom.BPM,
                length: nom.length,
                maxSR: nom.maxSR,
                creator: {
                    osuID: nom.creatorID,
                    osuUsername: nom.creatorOsu,
                    discordUsername: nom.creatorDiscord,
                },
            }
        }
        return staffNom;
    });

    // ensure data doesn't cut off between nominators
    let end = -1;
    for (let i = staffNominations.length - 1; i > 0; --i) {
        if (staffNominations[i].nominator.osuID !== staffNominations[i-1].nominator.osuID) {
            end = start + i;
            break;
        }
    }
    staffNominations = staffNominations.slice(0, end);

    ctx.body = { staffNominations, nextStart: end };
});

// Endpoint for accepting a nomination
staffNominationsRouter.post("/:id/update", async (ctx) => {
    let nominationID = ctx.params.id;
    if (!nominationID || !/\d+/.test(nominationID))
        return ctx.body = { error: "Invalid nomination ID given!" };

    nominationID = parseInt(nominationID);
    try {
        await Nomination.update(nominationID, {
            isValid: ctx.request.body.isValid,
            reviewer: ctx.state.user,
            lastReviewedAt: new Date,
        });
    } catch (e) {
        throw e;
    }

    ctx.body = {
        isValid: ctx.request.body.isValid,
        reviewer: ctx.state.user.osu.username,
        lastReviewedAt: new Date,
    };
});

export default staffNominationsRouter;
