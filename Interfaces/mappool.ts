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
    name: string
    mappack: string
    sheet: string
    modGroups: modGroup[] | null
}
