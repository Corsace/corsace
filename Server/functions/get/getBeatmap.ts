import { Beatmap } from "../../../Models/beatmap";
import { Beatmap as APIBeatmap } from "nodesu";
import { isPossessive } from "../../../Models/MCA_AYIM/guestRequest";
import { ModeDivisionType, modeList } from "../../../Interfaces/modes";
import { osuClient } from "../../osu";
import getBeatmapset from "./getBeatmapset";
import getMCAEligibility from "./getMCAEligibility";
import getModeDivison from "./getModeDivision";

export default async function getBeatmap (apiBeatmap: APIBeatmap | number, save: boolean) {
    const targetBeatmap: APIBeatmap | undefined = typeof apiBeatmap === "number" ? (await osuClient.beatmaps.getByBeatmapId(apiBeatmap) as APIBeatmap[])[0] : apiBeatmap;
    if (!targetBeatmap)
        return;

    let beatmap = await Beatmap.findOne({ where: { ID: targetBeatmap.id }});
    if (beatmap)
        return beatmap;
    if (!save)
        return;

    const modeDivision = await getModeDivison(targetBeatmap.mode!, save);
    if (!modeDivision)
        return;

    beatmap = new Beatmap();
    beatmap.ID = targetBeatmap.id;
    beatmap.mode = modeDivision;
    beatmap.difficulty = targetBeatmap.version;
    beatmap.circleSize = targetBeatmap.CS;
    beatmap.approachRate = targetBeatmap.AR;
    beatmap.overallDifficulty = targetBeatmap.OD;
    beatmap.hpDrain = targetBeatmap.HP;
    beatmap.circles = targetBeatmap.countNormal;
    beatmap.sliders = targetBeatmap.countSlider;
    beatmap.spinners = targetBeatmap.countSpinner;
    beatmap.rating = targetBeatmap.rating;
    beatmap.passCount = targetBeatmap.passcount;
    beatmap.hitLength = targetBeatmap.hitLength;
    beatmap.totalLength = targetBeatmap.totalLength;
    beatmap.totalSR = targetBeatmap.difficultyRating;
    beatmap.aimSR = targetBeatmap.diffAim;
    beatmap.speedSR = targetBeatmap.diffSpeed;
    beatmap.maxCombo = targetBeatmap.maxCombo;
    beatmap.playCount = targetBeatmap.playcount;
    beatmap.packs = targetBeatmap.packs?.join(",");
    beatmap.storyboard = targetBeatmap.storyboard;
    beatmap.video = targetBeatmap.video;

    const beatmapset = await getBeatmapset(targetBeatmap, save);
    if (!beatmapset)
        return;
    beatmap.beatmapset = beatmapset;

    if (!isPossessive(beatmap.difficulty)) {
        const eligibility = await getMCAEligibility(targetBeatmap, beatmap.beatmapset.creator, save);
        const mode = modeList[targetBeatmap.mode!];
        if (eligibility && mode in ModeDivisionType) {
            eligibility[mode as keyof typeof ModeDivisionType] = true;
            eligibility.storyboard = true;
            await eligibility.save();
        }
    }

    beatmap = await beatmap.save();
    return beatmap;
}