
import { createConnection, EntityManager } from "typeorm";
import { Category } from "../../Models/MCA_AYIM/category";
import { Nomination } from "../../Models/MCA_AYIM/nomination";
import { sleep } from "../utils/sleep";

async function script () {
    if (process.env.NODE_ENV !== "development") {
        throw new Error("To prevent disasters, you can only run this script using NODE_ENV=development; eg. `NODE_ENV=development npm run concatNoms`.");
    }

    console.log("This script can damage your database. Make sure to only execute this if you know what you're doing.");
    console.log("This script will automatically continue in 5 seconds. Cancel using Ctrl+C.");
    await sleep(5000);

    const conn = await createConnection();
    // ensure schema is up-to-date
    await conn.synchronize();
    console.log("DB schema is now up-to-date!");

    const entityManager = new EntityManager(conn);

    const categories = await Category.find();


    console.log(`Running through ${categories.length} categories...`);
    let catCount = 0;
    for (const cat of categories) { // Cycle through each category
        // Get all nominations for this category
        const nominations = await Nomination.
            createQueryBuilder("nomination")
            .innerJoin("nomination.category", "category")
            .where("nomination.categoryID = :categoryID", { categoryID: cat.ID })
            .getMany();

        // Reduce the list to unique nominations only
        const uniqueNominations: Nomination[] = nominations.filter((v, i, a) => {
            if (v.beatmapsetID)
                return a.findIndex(t => t.beatmapsetID === v.beatmapsetID) === i;
            else if (v.beatmapID)
                return a.findIndex(t => t.beatmapID === v.beatmapID) === i;
            else if (v.userID)
                return a.findIndex(t => t.userID === v.userID) === i;
            else
                throw new Error("Nomination has no beatmapset, beatmap or user!");
        });

        // Iterate over each unique nomination to delete duplicates and transfer nominators to it
        let uniqCount = 0;
        for (const nom of uniqueNominations) {
            uniqCount++;
            console.log(`Running unique nomination ${uniqCount}/${uniqueNominations.length}`);
            // Get all nominations for the target user/map/set (including itself)
            const dupeNoms = (await Nomination
                .createQueryBuilder("nomination")
                .select("nomination.ID")
                .addSelect("nomination.isValid")
                .addSelect("nomination.reviewerID")
                .addSelect("nomination.categoryID")
                .where("nomination.userID = :userID OR nomination.beatmapID = :beatmapID OR nomination.beatmapsetID = :setID", { 
                    userID: nom.userID ?? null, 
                    beatmapID: nom.beatmapID ?? null, 
                    setID: nom.beatmapsetID ?? null,
                }).getRawMany()
            ).filter(v => v.categoryID === cat.ID).map(v => {
                return {
                    ID: v.nomination_ID,
                    isValid: v.nomination_isValid === 1,
                    reviewerID: v.reviewerID,
                };
            });

            // Get all nominators for the target user/map/set (including from itself)
            const nominators = (await Nomination
                .createQueryBuilder("nomination")
                .leftJoin("nomination.nominators", "nominator")
                .select("nominator.ID")
                .addSelect("nomination.categoryID")
                .andWhere("nomination.userID = :userID OR nomination.beatmapID = :beatmapID OR nomination.beatmapsetID = :setID", { 
                    userID: nom.userID ?? null, 
                    beatmapID: nom.beatmapID ?? null, 
                    setID: nom.beatmapsetID ?? null,
                })
                .getRawMany()
            ).filter(v => v.categoryID === cat.ID && v.nominator_ID != null ).map(v => v.nominator_ID);
            // Check for validity conflicts, will decide on if a reviewer should still be assigned or not
            const conflict = dupeNoms.some(v => !v.isValid) && dupeNoms.some(v => v.isValid && v.reviewerID !== null);
            const reviewer = conflict ? null : dupeNoms.find(v => v.reviewerID !== null)?.reviewerID ?? null;
            // Check if nomination should be considered valid or not.
            // If no valid or any vetted to be valid, the nomination is valid.
            const isValid = !dupeNoms.some(v => !v.isValid) || dupeNoms.some(v => v.isValid && v.reviewerID !== null);

            // Delete all user-nomination relationships for all nominations (including itself)
            await entityManager.query(`DELETE FROM user_nominations_nomination WHERE nominationID IN (${dupeNoms.map(v => v.ID).join(", ")})` );

            // Delete all nominations ASIDE for itself
            const dupeNomsIDs = dupeNoms.filter(v => v.ID !== nom.ID).map(v => v.ID);
            if (dupeNomsIDs.length > 0)
                await entityManager.query(`DELETE FROM nomination WHERE ID IN (${dupeNomsIDs.join(", ")})` );

            // Assign nominators to itself if it is considered a valid nomination, do not assign it otherwise.
            if (isValid && nominators.length > 0)
                await entityManager.query(`INSERT INTO user_nominations_nomination (userID, nominationID) VALUES ${nominators.map(v => `(${v}, ${nom.ID})`).join(", ")}`);
            else if (!isValid)
                await entityManager.query(`DELETE FROM user_nominations_nomination WHERE nominationID = ${nom.ID}` );

            // Assign validity and reviewer as applicable
            await entityManager.query(`UPDATE nomination SET isValid = ${isValid ? 1 : 0}, reviewerID = ${reviewer ?? "NULL"} WHERE ID = ${nom.ID}`);
        }
        catCount++;
        console.log(`Done with category ${catCount}/${categories.length} (${cat.name} - ${cat.ID})`);
    }
}

if(module === require.main) {
    script()
        .then(() => {
            console.log("Script completed successfully!");
            process.exit(0);
        })
        .catch((err: Error) => {
            console.error("Script encountered an error!");
            console.error(err.stack);
            process.exit(1);
        });
}