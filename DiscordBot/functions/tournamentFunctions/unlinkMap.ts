import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";

export default async function unlinkMap (map: MappoolMap) {
    map.customBeatmap = null;
    map.jobPost = null;
    map.history = [];
    return map.save();
}