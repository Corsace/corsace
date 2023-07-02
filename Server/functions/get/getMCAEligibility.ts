import { Beatmap as APIBeatmap } from "nodesu";
import { MCAEligibility } from "../../../Models/MCA_AYIM/mcaEligibility";
import { User } from "../../../Models/user";

export default async function getMCAEligibility (apiBeatmap: APIBeatmap, user: User, save: boolean);
export default async function getMCAEligibility (year: number, user: User);
export default async function getMCAEligibility (beatmapOrYear: APIBeatmap | number, user: User, save?: boolean) {
    const mapYear = beatmapOrYear instanceof APIBeatmap ? beatmapOrYear.approvedDate.getUTCFullYear() : beatmapOrYear;
    let eligibility = await MCAEligibility.findOne({ relations: ["user"], where: { year: mapYear, user: { ID: user.ID }}});
    if (eligibility)
        return eligibility;
    if (!save)
        return;

    if (!eligibility) {
        eligibility = new MCAEligibility();
        eligibility.year = mapYear;
        eligibility.user = user;
    }
    return eligibility;
}