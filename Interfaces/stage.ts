import { Mappool } from "./mappool";
import { Phase } from "./phase";
import { Round } from "./round";

export enum StageType {
    Qualifiers,
    Singleelimination,
    Doubleelimination,
    Roundrobin,
    Swiss,
}

export enum ScoringMethod {
    ScoreV1,
    ScoreV2,
    Accuracy,
    Combo,
    Count300,
    Count100,
    Count50,
    CountMiss,
}

export interface Stage {
    ID:                         number;
    createdAt:                  Date;
    name:                       string;
    abbreviation:               string;
    order:                      number;
    stageType:                  StageType;
    scoringMethod:              ScoringMethod;
    isDraft?:                   boolean | null;
    setsBestOf:                 number;
    bestOf?:                    number | null;
    qualifierTeamChooseOrder?:  boolean | null;
    timespan:                   Phase;
    rounds:                     Round[];
    mappool:                    Mappool[];
    isFinished:                 boolean;
    initialSize:                number;
    finalSize:                  number;
}