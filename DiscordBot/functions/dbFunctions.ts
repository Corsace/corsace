import { Beatmap } from "../../Models/beatmap";
import { Beatmap as APIBeatmap } from "nodesu";
import { ModeDivision, ModeDivisionType } from "../../Models/MCA_AYIM/modeDivision";
import { isPossessive } from "../../Models/MCA_AYIM/guestRequest";
import { User } from "../../Models/user";
import { MCAEligibility } from "../../Models/MCA_AYIM/mcaEligibility";
import { modeList } from "../../Interfaces/modes";
import { Beatmapset } from "../../Models/beatmapset";
import { genres, langs } from "../../Interfaces/beatmap";
import { osuClient } from "../../Server/osu";

export async function getUser (ID: number, IDType: "osu" | "discord", save: boolean) {
    let user = await User.findOne({ where: { [IDType]: { userID: ID.toString() } }});
    if (user)
        return user;
    if (!save)
        return undefined;

    user = new User;
    user[IDType].userID = ID.toString();
    user = await user.save();
    return user;
}

export async function getModeDivison (modeDivisionId: number, save: boolean) {
    modeDivisionId += 1;
    let mode = await ModeDivision.findOne({ where: { ID: modeDivisionId }});
    if (!mode) {
        if (save) {
            mode = new ModeDivision;
            mode.ID = modeDivisionId;
            mode.name = ModeDivisionType[mode.ID];
            mode = await mode.save();
        } else
            return undefined;
    }
    return mode;
}

export async function getMCAEligibility (apiBeatmap: APIBeatmap, user: User, save: boolean);
export async function getMCAEligibility (year: number, user: User);
export async function getMCAEligibility (beatmapOrYear: APIBeatmap | number, user: User, save?: boolean) {
    const mapYear = beatmapOrYear instanceof APIBeatmap ? beatmapOrYear.approvedDate.getUTCFullYear() : beatmapOrYear;
    let eligibility = await MCAEligibility.findOne({ relations: ["user"], where: { year: mapYear, user: { ID: user.ID }}});
    if (eligibility)
        return eligibility;
    if (!save)
        return undefined;

    if (!eligibility) {
        eligibility = new MCAEligibility();
        eligibility.year = mapYear;
        eligibility.user = user;
    }
    return eligibility;
}

export async function getBeatmapSet (apiBeatmap: APIBeatmap | number, save: boolean) {
    const targetBeatmap: APIBeatmap | undefined = typeof apiBeatmap === "number" ? (await osuClient.beatmaps.getBySetId(apiBeatmap) as APIBeatmap[])[0] : apiBeatmap;
    if (!targetBeatmap)
        return undefined;

    let beatmapSet = await Beatmapset.findOne({ where: { ID: targetBeatmap.beatmapSetId }});
    if (beatmapSet)
        return beatmapSet;
    if (!save)
        return undefined;

    beatmapSet = new Beatmapset;
    beatmapSet.ID = targetBeatmap.beatmapSetId;
    beatmapSet.approvedDate = targetBeatmap.approvedDate;
    beatmapSet.submitDate = targetBeatmap.submitDate;
    beatmapSet.BPM = targetBeatmap.bpm;
    beatmapSet.artist = targetBeatmap.artist;
    beatmapSet.title = targetBeatmap.title;
    beatmapSet.genre = genres[targetBeatmap.genre];
    beatmapSet.language = langs[targetBeatmap.language];
    beatmapSet.tags = targetBeatmap.tags.join(" ");
    beatmapSet.favourites = targetBeatmap.favoriteCount;

    const user = await getUser(targetBeatmap.creatorId, "osu", save);
    if (!user)
        return undefined;
    beatmapSet.creator = user;
    
    beatmapSet = await beatmapSet.save();
    return beatmapSet;
}

export async function getBeatmap (apiBeatmap: APIBeatmap | number, save: boolean) {
    const targetBeatmap: APIBeatmap | undefined = typeof apiBeatmap === "number" ? (await osuClient.beatmaps.getByBeatmapId(apiBeatmap) as APIBeatmap[])[0] : apiBeatmap;
    if (!targetBeatmap)
        return undefined;

    let beatmap = await Beatmap.findOne({ where: { ID: targetBeatmap.id }});
    if (beatmap)
        return beatmap;
    if (!save)
        return undefined;

    const mode = await getModeDivison(targetBeatmap.mode as number, save);
    if (!mode)
        return undefined;

    beatmap = new Beatmap;
    beatmap.ID = targetBeatmap.id;
    beatmap.mode = mode;
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

    const beatmapset = await getBeatmapSet(targetBeatmap, save);
    if (!beatmapset)
        return undefined;
    beatmap.beatmapset = beatmapset;

    if (!isPossessive(beatmap.difficulty)) {
        const eligibility = await getMCAEligibility(targetBeatmap, beatmap.beatmapset.creator, save);
        if (!eligibility[modeList[targetBeatmap.mode as number]]) {
            eligibility[modeList[targetBeatmap.mode as number]] = true;
            eligibility.storyboard = true;
            await eligibility.save();
        }
    }

    beatmap = await beatmap.save();
    return beatmap;
}