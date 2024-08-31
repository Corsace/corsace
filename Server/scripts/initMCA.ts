import ormConfig from "../../ormconfig";
import { MCA } from "../../Models/MCA_AYIM/mca";
import { ModeDivision } from "../../Models/MCA_AYIM/modeDivision";
import { CategoryFilter, CategoryGenerator } from "../../Models/MCA_AYIM/category";
import { CategoryType } from "../../Interfaces/category";

const mca2021Categories: {
    name: string,
    type: CategoryType,
    modeName: string,
    filter: CategoryFilter,
}[] = [
    {
        "name": "collab",
        "type": CategoryType.Beatmapsets,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "highBPMAlternator",
        "type": CategoryType.Beatmapsets,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "hitsounder",
        "type": CategoryType.Users,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "hitsounding",
        "type": CategoryType.Beatmapsets,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "mapper",
        "type": CategoryType.Users,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "marathon",
        "type": CategoryType.Beatmapsets,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "modder",
        "type": CategoryType.Users,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "mostPromising",
        "type": CategoryType.Users,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "outCont",
        "type": CategoryType.Users,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "sliderTech",
        "type": CategoryType.Beatmapsets,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "smallCircles",
        "type": CategoryType.Beatmapsets,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "complex",
        "type": CategoryType.Beatmapsets,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "unorthodox",
        "type": CategoryType.Beatmapsets,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "vanilla",
        "type": CategoryType.Beatmapsets,
        "modeName": "standard",
        filter: {},
    },
    {
        "name": "collab",
        "type": CategoryType.Beatmapsets,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "highBPMTaiko",
        "type": CategoryType.Beatmapsets,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "featuredArtist",
        "type": CategoryType.Beatmapsets,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "mapper",
        "type": CategoryType.Users,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "marathon",
        "type": CategoryType.Beatmapsets,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "modder",
        "type": CategoryType.Users,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "mostInfluential",
        "type": CategoryType.Users,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "mostPromising",
        "type": CategoryType.Users,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "outCont",
        "type": CategoryType.Users,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "simplisticTaiko",
        "type": CategoryType.Beatmapsets,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "sliderVelocity",
        "type": CategoryType.Beatmapsets,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "lowBPMTaiko",
        "type": CategoryType.Beatmapsets,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "spread",
        "type": CategoryType.Beatmapsets,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "technicalTaiko",
        "type": CategoryType.Beatmapsets,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "diversity",
        "type": CategoryType.Beatmapsets,
        "modeName": "taiko",
        filter: {},
    },
    {
        "name": "collab",
        "type": CategoryType.Beatmapsets,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "communityPillar",
        "type": CategoryType.Users,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "featuredArtist",
        "type": CategoryType.Beatmapsets,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "hitsounding",
        "type": CategoryType.Beatmapsets,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "mapper",
        "type": CategoryType.Users,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "marathon",
        "type": CategoryType.Beatmapsets,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "modder",
        "type": CategoryType.Users,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "mostInspiring",
        "type": CategoryType.Users,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "mostPromising",
        "type": CategoryType.Users,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "simplistic",
        "type": CategoryType.Beatmapsets,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "spread",
        "type": CategoryType.Beatmapsets,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "technicalCatch",
        "type": CategoryType.Beatmapsets,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "antiMetaCatch",
        "type": CategoryType.Beatmapsets,
        "modeName": "fruits",
        filter: {},
    },
    {
        "name": "7K",
        "type": CategoryType.Beatmapsets,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "antiMeta",
        "type": CategoryType.Beatmapsets,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "hitsounding",
        "type": CategoryType.Beatmapsets,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "hybrid",
        "type": CategoryType.Beatmapsets,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "longNotes",
        "type": CategoryType.Beatmapsets,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "mapper",
        "type": CategoryType.Users,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "marathon",
        "type": CategoryType.Beatmapsets,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "modder",
        "type": CategoryType.Users,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "mostInfluential",
        "type": CategoryType.Users,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "mostPromising",
        "type": CategoryType.Users,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "sliderVelocity",
        "type": CategoryType.Beatmapsets,
        "modeName": "mania",
        filter: {},
    },
    {
        "name": "spread",
        "type": CategoryType.Beatmapsets,
        "modeName": "mania",
        filter: {},
    },
];

ormConfig.initialize().then(async () => {
    let mca = await MCA.findOne({
        where: {
            year: 2021,
        },
    });
    if (mca) {
        console.log("\x1b[41;1mMCA 2021 already exists!\x1b[0m");
        return;
    }

    mca = await MCA.fillAndSave({
        year: 2021,
        nominationStart: new Date(),
        nominationEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        votingStart: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * 2),
        votingEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * 4),
        results: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * 5),
    });

    const modes = await ModeDivision.find();
    const categoryGenerator = new CategoryGenerator();
    for (const mode of modes) {
        const userGrand = categoryGenerator.createGrandAward(mca, mode, CategoryType.Users, mode.name === "storyboard");
        const mapGrand = categoryGenerator.createGrandAward(mca, mode, CategoryType.Beatmapsets, mode.name === "storyboard");
        const categories = [userGrand.save(), mapGrand.save()];

        mca2021Categories.filter(c => c.modeName === mode.name).forEach(c => {
            const category = categoryGenerator.createOrUpdate({
                name: c.name,
                maxNominations: 3,
                type: c.type,
                mode: mode,
                mca: mca,
            }, {});
            categories.push(category.save());
        });

        await Promise.all(categories);
    }

    console.log("\x1b[42;1mMCA 2021 created!\x1b[0m");
}).catch(console.error);