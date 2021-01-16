export interface StageQuery {
    category: number;
    option: string;
    order: "ASC" | "DESC" | undefined;
    text: string;
    skip: number;
}
