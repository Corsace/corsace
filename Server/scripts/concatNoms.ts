
import { createConnection } from "typeorm";
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

    const categories = await Category.find();


    console.log(`Running through ${categories.length} categories...`);
    let catCount = 0;
    for (const cat of categories) { // Cycle through each category
        // Get all nominations for this category
        const nominations = await Nomination.find({
            relations: ["nominators", "reviewer", "user", "beatmapset", "beatmap", "category"],
            where: {
                category: cat,
            },
        });

        // Reduce list of nominations to 1 for each user/beatmap/set
        const uniqueNominations: Nomination[] = nominations.filter((v, i, a) => {
            return a.findIndex(t => 
                t.beatmapset?.ID === v.beatmapset?.ID ||
                t.beatmap?.ID === v.beatmap?.ID ||
                t.user?.ID === v.user?.ID
            ) === i;
        });
        const dupeNoms: Nomination[] = [];
        for (let i = 0; i < uniqueNominations.length; i++) { // Cycle through reduced list
            const nom = uniqueNominations[i];
            // Find all nominations that are for the same user/beatmap/set
            const uniqueDupeNoms = nominations.filter(n => {
                return (n.beatmapset?.ID === nom.beatmapset?.ID ||
                    n.beatmap?.ID === nom.beatmap?.ID ||
                    n.user?.ID === nom.user?.ID) && n.ID !== nom.ID;

            });
            // See if any of the nominations were reviewed, apply the reviewer and the validity status to it
            const reviewedNoms = uniqueDupeNoms.filter(n => n.reviewer);
            // If invalid, remove all nominators; otherwise, add all nominators
            if (reviewedNoms.length > 0 && reviewedNoms.some(n => !n.isValid)) {
                nom.nominators = [];
                nom.isValid = false;
            } else {
                nom.nominators = uniqueDupeNoms.map(n => n.nominators).flat();
            }
            if (reviewedNoms.length > 0) {
                nom.reviewer = reviewedNoms[0].reviewer; // Just take any reviewer
                nom.lastReviewedAt = reviewedNoms[0].lastReviewedAt; // Just take any lastReviewedAt
            }
            uniqueNominations[i] = nom;
            dupeNoms.push(...uniqueDupeNoms);
        }
        await Promise.all(dupeNoms.map(n => n.remove()));
        await Promise.all(uniqueNominations.map(n => n.save()));
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