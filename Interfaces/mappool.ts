export enum ModSlots {
    NM,
    HD,
    HR,
    DT,
    FM,
    TB
}

export interface modGroup {

}

export interface MappoolInfo {
    name: String
    mappack: String
    sheet: String
    modGroups: modGroup[] | null
}
