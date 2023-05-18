import { Brackets } from "typeorm";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";

export const tournamentSearchConditions = {
    "ID": "tournament.ID = :target",
    "server": "tournament.server = :target",
    "name": new Brackets(qb => {
        qb.where("tournament.name LIKE :target")
            .orWhere("tournament.abbreviation LIKE :target");
    })
};

export default async function getTournaments (target: string, searchType: keyof typeof tournamentSearchConditions, channelID?: string, tournamentStatusFilters?: TournamentStatus[], stages?: boolean, rounds?: boolean) {
    const tournamentQ = Tournament.createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.mode", "mode")
        .leftJoin("tournament.channels", "channel");

    if (stages)
        tournamentQ.leftJoinAndSelect("tournament.stages", "stage");
    if (rounds)
        tournamentQ.leftJoinAndSelect("stage.rounds", "round");

    tournamentQ.where(tournamentSearchConditions[searchType], { target });

    if (channelID)
        tournamentQ
            .andWhere("channel.channelID = :channelID", { channelID })

    if (tournamentStatusFilters)
        tournamentQ.andWhere("tournament.status IN (:...status)", { status: tournamentStatusFilters });

    return await tournamentQ.getMany();
}