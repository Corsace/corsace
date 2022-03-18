export interface DemeritReportInfo {
    ID: number;
    reportDate: Date;
    targetType: "USER" | "TEAM";
    amount: number;
    reason: string;
    user?: number;
    team?: number; 
}
