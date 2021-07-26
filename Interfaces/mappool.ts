export enum ModSlots {
    NM,
    HD,
    HR,
    DT,
    FM,
    TB
}

export interface ModGroup {
    beatmaps: MappoolMap[]
    mod: "NM" | "HD" | "HR" | "DT" | "FM" | "TB" 
}

export interface MappoolInfo {
    name: string
    mappack: string
    sheet: string
    modGroups: ModGroup[]
    length: number //check
    slug: string

}

export interface MappoolMap {
    setID?: string
    mapID?: string
    mod?: "NM" | "HD" | "HR" | "DT" | "FM" | "TB" 
    name: string
    style?: Record<string, any>
    artist?: string
    title?: string
    difficulty?: string
    time?: string
    bpm?: number
    stars?: number
}
