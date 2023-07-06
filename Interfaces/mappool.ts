export interface Mappool {
    ID:            number;
    createdAt:     Date;
    name:          string;
    abbreviation:  string;
    isPublic:      boolean;
    bannable:      boolean;
    mappackLink:   null;
    mappackExpiry: null;
    targetSR:      number;
    order:         number;
    slots:         MappoolSlot[];
}

export interface MappoolSlot {
    ID:             number;
    createdAt:      Date;
    name:           string;
    acronym:        string;
    colour:         null;
    allowedMods:    number | null;
    userModCount:   number | null;
    uniqueModCount: number | null;
    maps:           MappoolMap[];
}

export interface MappoolMap {
    ID:              number;
    createdAt:       Date;
    lastUpdate:      Date;
    order:           number;
    isCustom:        boolean;
    deadline:        Date | null;
    customThreadID:  string | null;
    customMessageID: string | null;
}