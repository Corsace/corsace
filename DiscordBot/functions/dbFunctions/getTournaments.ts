import { Brackets } from "typeorm";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";

export const tournamentSearchConditions = {
    "ID": "tournament.ID = :target",
    "server": "tournament.server = :target",
    "channel": "channel.channelID = :target",
    "name": new Brackets(qb => {
        qb.where("tournament.name LIKE :target")
            .orWhere("tournament.abbreviation LIKE :target");
    })
};

export default function getTournaments (target: string, searchType: keyof typeof tournamentSearchConditions, tournamentStatusFilters?: TournamentStatus[], stageOrRound?: boolean, mappools?: boolean, slots?: boolean, maps?: boolean, jobPosts?: boolean) {
    const tournamentQ = Tournament.createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.mode", "mode")
        .leftJoin("tournament.channels", "channel");

    if (stageOrRound)
        tournamentQ
            .leftJoinAndSelect("tournament.stages", "stage")
            .leftJoinAndSelect("stage.rounds", "round");

    if (mappools) {
        tournamentQ
            .leftJoinAndSelect("stage.mappool", "stageMappool")
            .leftJoinAndSelect("round.mappool", "roundMappool");

        if (slots) {
            tournamentQ
                .leftJoinAndSelect("stageMappool.slots", "stageSlot")
                .leftJoinAndSelect("roundMappool.slots", "roundSlot");

            if (maps) {
                tournamentQ
                    .leftJoinAndSelect("stageSlot.maps", "stageMap")
                    .leftJoinAndSelect("roundSlot.maps", "roundMap");

                if (jobPosts)
                    tournamentQ
                        .leftJoinAndSelect("stageMap.jobPost", "stageJobPost")
                        .leftJoinAndSelect("roundMap.jobPost", "roundJobPost");
            }
        }
    }


    tournamentQ.where(tournamentSearchConditions[searchType], { target });

    if (tournamentStatusFilters)
        tournamentQ.andWhere("tournament.status IN (:...status)", { status: tournamentStatusFilters });

    return tournamentQ.getMany();
}