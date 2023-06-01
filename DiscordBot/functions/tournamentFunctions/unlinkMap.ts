import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";

export default async function unlinkMap (map: MappoolMap) {
    map.customBeatmap = map.jobPost = null;
    map.history = [];
    return map.save();
}