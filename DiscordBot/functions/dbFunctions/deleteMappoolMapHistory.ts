import { MappoolMapHistory } from "../../../Models/tournaments/mappools/mappoolMapHistory";

export default async function deleteMappoolMapHistory (IDs: number[]) {
    const history = await MappoolMapHistory
        .createQueryBuilder("history")
        .where("history.ID IN (:...IDs)", { IDs })
        .getMany();

    return Promise.all(history.map(h => h.remove()));
}