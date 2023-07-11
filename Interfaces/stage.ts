import { Mappool } from "./mappool";
import { Phase } from "./phase";
import { Round } from "./round";

export interface Stage {
    ID:                       number;
    createdAt:                Date;
    name:                     string;
    abbreviation:             string;
    order:                    number;
    stageType:                number;
    scoringMethod:            number;
    isDraft:                  null;
    setsBestOf:               number;
    bestOf:                   null;
    qualifierTeamChooseOrder: null;
    timespan:                 Phase;
    rounds:                   Round[];
    mappool:                  Mappool[];
    isFinished:               boolean;
    initialSize:              number;
    finalSize:                number;
}