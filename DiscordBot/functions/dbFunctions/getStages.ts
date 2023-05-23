import { Brackets } from "typeorm";
import { Stage } from "../../../Models/tournaments/stage";

export const stageSearchConditions = {
    "ID": "stage.ID = :target",
    "tournamentID": "tournament.ID = :target",
    "server": "tournament.server = :target",
    "name": new Brackets(qb => {
        qb.where("stage.name LIKE :target")
            .orWhere("stage.abbreviation LIKE :target");
    })
};

export default function getStages (target: string | number, searchType: keyof typeof stageSearchConditions, rounds?: boolean, tournament?: boolean) {
    const stageQ = Stage.createQueryBuilder("stage")

    if (tournament)
        stageQ.leftJoinAndSelect("stage.tournament", "tournament");
    else
        stageQ.leftJoin("stage.tournament", "tournament");

    if (rounds)
        stageQ.leftJoinAndSelect("stage.rounds", "round");

    stageQ.where(stageSearchConditions[searchType], { target });

    return stageQ.getMany();
}