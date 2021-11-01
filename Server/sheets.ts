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
    let data;
    try {
        data = (await sheetsClient.spreadsheets.values.get({
            spreadsheetId: config.google.sheets[pool],
            range: `'${round}'!A2:P`,
        })).data.values as any[][];
    } catch (e) {
        if (e) data = undefined;
    }
    return data;
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

async function appendSongSubmission (isOpen: boolean, data: any[]) {
    return sheetsClient.spreadsheets.values.append({
        spreadsheetId: config.google.sheets.songs,
        range: `${isOpen ? "CO" : "CC"} Submissions`,
        valueInputOption: "RAW",
        requestBody: {
            values: [ data ],
        },
    });
}

async function appendToHistory (pool: "openMappool" | "closedMappool", data: any[]) {
    return sheetsClient.spreadsheets.values.append({
        spreadsheetId: config.google.sheets[pool],
        range: "history",
        valueInputOption: "RAW",
        requestBody: {
            values: [ data ],
        },
    });
}

export { sheetsClient, getToDoData, getPoolData, updatePoolRow, appendSongSubmission, appendToHistory };