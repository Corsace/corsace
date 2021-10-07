import { config } from "node-config-ts";
import { google } from "googleapis";

const auth = new google.auth.JWT({
    email: config.google.credentials.client_email,
    key: config.google.credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheetsClient = google.sheets({
    version: "v4",
    auth,
});

const getToDoData = async () => (await sheetsClient.spreadsheets.values.get({
    spreadsheetId: config.google.sheets.todo,
    range: "todos!A2:E",
})).data.values as any[][];

async function getPoolData (pool: "openMappool" | "closedMappool", round: string) {
    return (await sheetsClient.spreadsheets.values.get({
        spreadsheetId: config.google.sheets[pool],
        range: `'${round}'!A2:P`,
    })).data.values as any[][];
}

async function updatePoolRow (pool: "openMappool" | "closedMappool", range: string, data: any[]) {
    return sheetsClient.spreadsheets.values.update({
        spreadsheetId: config.google.sheets[pool],
        range,
        valueInputOption: "RAW", 
        requestBody: {
            values: [ data ],
        },
    });
}

export { sheetsClient, getToDoData, getPoolData, updatePoolRow };