import { Beatmap, Mode, Mods, Score } from "nodesu";

/**
 * PP calculation given a beatmap and a score based on https://github.com/ppy/osu/blob/master/osu.Game.Rulesets.Osu/Difficulty/OsuPerformanceCalculator.cs
 * Probably need to move to interfaces in the future
 * @param beatmap The target beatmap
 * @param score The target score
 * @returns The PP value
 */
export default function ppCalculator (beatmap: Beatmap, score: Score): number {
    const unrankable = 536870912 + 2048 + 4194304 + 8192 + 128;
    if (score.enabledMods && (score.enabledMods & unrankable) !== 0)
        return 0;
    
    let totalPP = 0;
    switch (beatmap.mode) {
        case Mode.osu: { // I'll do other modes later (TODO)
            let multiplier = 1.12;
            if (score.enabledMods && (score.enabledMods & Mods.NoFail) !== 0)
                multiplier *= Math.max(0.9, 1 - 0.02 * score.countMiss);
            if (score.enabledMods && (score.enabledMods & Mods.SpunOut) !== 0)
                multiplier *= 1 - Math.pow(beatmap.countSpinner / (beatmap.countNormal + beatmap.countSlider + beatmap.countSpinner), 0.85);

            const aim = aimPP(beatmap, score);
            const speed = speedPP(beatmap, score);
            const acc = accPP(beatmap, score);
            totalPP = Math.pow(
                Math.pow(aim, 1.1) +
                Math.pow(speed, 1.1) +
                Math.pow(acc, 1.1), 1 / 1.1
            ) * multiplier;
            break;
        }
    }


    return totalPP;
}

function aimPP (beatmap: Beatmap, score: Score): number {
    const totalHits = beatmap.countNormal + beatmap.countSlider + beatmap.countSpinner;
    const accuracy = (score.count50 + 2 * score.count100 + 6 * score.count300) / (6 * totalHits);

    let rawAim = beatmap.diffAim;
    
    if (score.enabledMods && (score.enabledMods & 4) !== 0)
        rawAim = Math.pow(rawAim, 0.8);
    
    let aimVal = Math.pow(5 * Math.max(1, rawAim / 0.0675) - 4, 3) / 100000;

    const lengthBonus = 0.95 + 0.4 * Math.min(1.0, totalHits / 2000.0) + (totalHits > 2000 ? Math.log10(totalHits / 2000.0) * 0.5 : 0.0);
    aimVal *= lengthBonus;

    if (score.countMiss > 0)
        aimVal *= 0.97 * Math.pow(1 - Math.pow(score.countMiss / totalHits, 0.775), score.countMiss);
    
    if (beatmap.maxCombo > 0)
        aimVal *= Math.min(1, Math.pow(score.maxCombo, 0.8) / Math.pow(beatmap.maxCombo, 0.8));
    
    let arFactor = 0;
    if (beatmap.diffApproach > 10.33)
        arFactor = beatmap.diffApproach - 10.33;
    else if (beatmap.diffApproach < 8)
        arFactor = 0.025 * (8 - beatmap.diffApproach);
    const arTotalHitsFactor = 1 / (1 + Math.exp(-(0.007 * (totalHits - 400))));
    const arBonus = 1 + (0.03 + 0.37 * arTotalHitsFactor) * arFactor;

    if (score.enabledMods && (score.enabledMods & Mods.Hidden) !== 0)
        aimVal *= 1 + 0.04 * (12 - beatmap.diffApproach);

    let flBonus = 1;
    if (score.enabledMods && (score.enabledMods & Mods.Flashlight) !== 0)
        flBonus = 1 + 0.35 * Math.min(1, totalHits / 200) +
            (totalHits > 200 ? 0.3 * Math.min(1, (totalHits - 200) / 300) +
                (totalHits > 500 ? (totalHits - 500) / 1200 : 0)
                : 0);
    
    aimVal *= Math.max(flBonus, arBonus);

    aimVal *= 0.5 + accuracy / 2;
    aimVal *= 0.98 + Math.pow(beatmap.diffOverall, 2) / 2500;

    return aimVal;
}

function speedPP (beatmap: Beatmap, score: Score): number {
    const totalHits = beatmap.countNormal + beatmap.countSlider + beatmap.countSpinner;
    const accuracy = (score.count50 + 2 * score.count100 + 6 * score.count300) / (6 * totalHits);

    let speedVal = Math.pow(5 * Math.max(1, beatmap.diffSpeed / 0.0675) - 4, 3) / 100000;

    const lengthBonus = 0.95 + 0.4 * Math.min(1.0, totalHits / 2000.0) + (totalHits > 2000 ? Math.log10(totalHits / 2000.0) * 0.5 : 0.0);
    speedVal *= lengthBonus;
    
    if (score.countMiss > 0)
        speedVal *= 0.97 * Math.pow(1 - Math.pow(score.countMiss / totalHits, 0.775), Math.pow(score.countMiss, 0.875));

    if (beatmap.maxCombo > 0)
        speedVal *= Math.min(1, Math.pow(score.maxCombo, 0.8) / Math.pow(beatmap.maxCombo, 0.8));

    let arFactor = 0;
    if (beatmap.diffApproach > 10.33)
        arFactor = beatmap.diffApproach - 10.33;
    const arTotalHitsFactor = 1 / (1 + Math.exp(-(0.007 * (totalHits - 400))));
    speedVal *= 1 + (0.03 + 0.37 * arTotalHitsFactor) * arFactor;

    if (score.enabledMods && (score.enabledMods & Mods.Hidden) !== 0)
        speedVal *= 1 + 0.04 * (12 - beatmap.diffApproach);

    speedVal *= (0.95 + Math.pow(beatmap.diffOverall, 2) / 750) * Math.pow(accuracy, (14.5 - Math.max(beatmap.diffOverall, 8)) / 2);
    speedVal *= Math.pow(0.98, score.count50 < totalHits / 500 ? 0 : score.count50 - totalHits / 500);

    return speedVal;

}

function accPP (beatmap: Beatmap, score: Score): number {
    const totalHits = beatmap.countNormal + beatmap.countSlider + beatmap.countSpinner;

    let betterAcc = 0;

    if (beatmap.countNormal > 0)
        betterAcc = Math.max(0, ((score.count300 - (totalHits - beatmap.countNormal)) * 6 + score.count100 * 2 + score.count50) / (6 * beatmap.countNormal));

    let accVal = Math.pow(1.52163, beatmap.diffOverall) * Math.pow(betterAcc, 24) * 2.83;
    accVal *= Math.min(1.15, Math.pow(beatmap.countNormal / 1000, 0.3));

    if (score.enabledMods && (score.enabledMods & Mods.Hidden) !== 0)
        accVal *= 1.08;
    if (score.enabledMods && (score.enabledMods & Mods.Hidden) !== 0)
        accVal *= 1.02;

    return accVal;
}