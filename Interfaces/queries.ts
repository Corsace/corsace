export interface StageQuery {
    category: number;
    option: string;
    order: "ASC" | "DESC" | undefined;
    text: string;
    skip: number;
    played: number[];
    favourites: number[];
}

export interface MapperQuery {
    text?: string;
    skip?: string;
    year: string;
    mode?: string;
    option?: string;
    notCommented?: string;
    friends?: number[];
    order?: "ASC" | "DESC" | undefined;
}
