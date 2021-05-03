export interface StageQuery {
    category: number;
    option: string;
    order: "ASC" | "DESC" | undefined;
    text: string;
    skip: number;
}

export interface MapperQuery {
    text: string;
    skip: string;
    year: string;
    mode: string;
    option: string;
    order: "ASC" | "DESC" | undefined;
}
