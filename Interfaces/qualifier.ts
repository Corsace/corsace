export interface BaseQualifier {
    ID: number;
    date: Date;
    team?: {
        name: string;
        avatarURL?: string | null;
    };
}