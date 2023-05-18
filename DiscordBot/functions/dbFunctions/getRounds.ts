import { Brackets } from "typeorm";
import { Round } from "../../../Models/tournaments/round";

export const roundSearchConditions = {
    "ID": "round.ID = :target",
    "stageID": "stage.ID = :target",
    "tournamentID": "tournament.ID = :target",
    "server": "tournament.server = :target",
    "name": new Brackets(qb => {
        qb.where("round.name LIKE :target")
            .orWhere("round.abbreviation LIKE :target");
    }),
};

export default function getRounds (target: string | number, searchType: keyof typeof roundSearchConditions, stage?: boolean, tournament?: boolean) {
    const roundQ = Round.createQueryBuilder("round")

    if (stage)
        roundQ.leftJoinAndSelect("round.stage", "stage");
    else
        roundQ.leftJoin("round.stage", "stage");

    if (tournament)
        roundQ.leftJoinAndSelect("stage.tournament", "tournament");
    else
        roundQ.leftJoin("stage.tournament", "tournament");

    roundQ.where(roundSearchConditions[searchType], { target });

    return roundQ.getMany();
}