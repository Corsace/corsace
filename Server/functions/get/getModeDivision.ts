import { ModeDivision, ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";

export default async function getModeDivison (modeDivisionId: number, save: boolean) {
    modeDivisionId += 1;
    let mode = await ModeDivision.findOne({ where: { ID: modeDivisionId }});
    if (!mode) {
        if (save) {
            mode = new ModeDivision;
            mode.ID = modeDivisionId;
            mode.name = ModeDivisionType[mode.ID];
            mode = await mode.save();
        } else
            return;
    }
    return mode;
}