import { Brackets } from "typeorm";
import { Stage } from "../../../Models/tournaments/stage";

export const stageSearchConditions = {
    "ID": "stage.ID = :target",
    "tournamentID": "tournament.ID = :target",
    "server": "tournament.server = :target",
    "name": (target: string | number) => new Brackets(qb => {
        if (typeof target === "string") {
            if (target.length <= 4) {
                qb.where("stage.abbreviation LIKE :target")
                    .orWhere("mappool.abbreviation LIKE :target");
            } else {
                qb.where("stage.name LIKE :target")
                    .orWhere("mappool.name LIKE :target");
            }
        }
    }),
};

export default function getStages (target: string | number, searchType: keyof typeof stageSearchConditions, rounds?: boolean, tournament?: boolean) {
    const stageQ = Stage.createQueryBuilder("stage");

    if (tournament)
        stageQ.leftJoinAndSelect("stage.tournament", "tournament");
    else
        stageQ.leftJoin("stage.tournament", "tournament");

    if (rounds)
        stageQ.leftJoinAndSelect("stage.rounds", "round");

    if (searchType === "name")
        stageQ
            .leftJoin("stage.mappool", "mappool")
            .where(stageSearchConditions[searchType](target), { target });
    else
        stageQ.where(stageSearchConditions[searchType], { target });

    return stageQ.getMany();
}