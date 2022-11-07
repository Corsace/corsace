
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
            if (v.beatmapset)
                return a.findIndex(t => t.beatmapset?.ID === v.beatmapset?.ID) === i;
            else if (v.beatmap)
                return a.findIndex(t => t.beatmap?.ID === v.beatmap?.ID) === i;
            else if (v.user)
                return a.findIndex(t => t.user?.ID === v.user?.ID) === i;
            else
                throw new Error("Nomination has no beatmapset, beatmap or user!");
        });
        console.log(`Category ${cat.name} - ${cat.ID} contains ${nominations.length} nominations, reduced to ${uniqueNominations.length} unique nominations.`);
        const dupeNoms: Nomination[] = [];
        for (let i = 0; i < uniqueNominations.length; i++) { // Cycle through reduced list
            console.log(`Running unique nomination ${i + 1}/${uniqueNominations.length}`);
            const nom = uniqueNominations[i];
            // Find all nominations that are for the same user/beatmap/set
            const uniqueDupeNoms = nominations.filter(n => {
                if (nom.beatmapset)
                    return n.beatmapset?.ID === nom.beatmapset.ID;
                else if (nom.beatmap)
                    return n.beatmap?.ID === nom.beatmap.ID;
                else if (nom.user)
                    return n.user?.ID === nom.user.ID;
                else
                    throw new Error("Nomination has no beatmapset, beatmap or user!");
            });

            // If invalid and no other dupe nomination is currently valid, remove all nominators
            // Otherwise, add all nominators, and remove reviewer if there are validity conflicts
            if (uniqueDupeNoms.some(n => !n.isValid) && !uniqueDupeNoms.some(n => n.isValid && n.reviewer)) {
                nom.nominators = [];
                nom.isValid = false;
                nom.reviewer = uniqueDupeNoms.find(n => !n.isValid)!.reviewer; // Just take any reviewer, all invalid reviews have reviewers
                nom.lastReviewedAt = uniqueDupeNoms.find(n => !n.isValid)!.lastReviewedAt; // Just take any lastReviewedAt
            } else {
                nom.nominators = uniqueDupeNoms.map(n => n.nominators).flat();
    
                if (uniqueDupeNoms.some(n => !n.isValid)) 
                    // If there are any invalid nominations, then that means there are review conflicts, so remove reviewer
                    nom.reviewer = undefined;
                else if (!nom.reviewer && uniqueDupeNoms.some(n => n.reviewer)) {
                    nom.reviewer = uniqueDupeNoms.find(n => n.reviewer)!.reviewer; // Just take any reviewer
                    nom.lastReviewedAt = uniqueDupeNoms.find(n => n.reviewer)!.lastReviewedAt; // Just take any lastReviewedAt
                }
                
                nom.isValid = true;
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