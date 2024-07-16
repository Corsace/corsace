import { osuV2WikiPage } from "../../Interfaces/osuAPIV2";
import { osuV2Client } from "./index";

const wikiData: {
    lastRetrieved: Date;
    data: osuV2WikiPage;
    path: string;
}[] = [];

let contentUsageData: {
    name: string;
    link?: string;
    status: "allowed" | "disallowed" | "unknown" | "allowed with exceptions";
    notes?: string;
}[] = [];

const wikiStatusToContentUsageStatus: Record<string, "allowed" | "disallowed" | "unknown" | "allowed with exceptions"> = {
    "true": "allowed",
    "false": "disallowed",
    "partial": "allowed with exceptions",
};

export async function getWikiPage (path: string, locale?: string) {
    let wikiPage = wikiData.find(w => w.path === path);
    if (!wikiPage?.data || !wikiPage.lastRetrieved || new Date().getTime() - wikiPage.lastRetrieved.getTime() > 1000 * 60 * 60 * 24) {
        wikiPage = {
            lastRetrieved: new Date(),
            data: await osuV2Client.getWikiPage(path, locale),
            path,
        };
    }
    return wikiPage.data;
}

export async function getContentUsageData () {
    const path = "Rules/Content_usage_permissions";

    const wikiPage = wikiData.find(w => w.path === path);
    if (wikiPage && wikiPage.lastRetrieved.getTime() - new Date().getTime() < 1000 * 60 * 60 * 24)
        return contentUsageData;
    
    const { markdown } = await getWikiPage(path);

    const lines = markdown.split("\n");
    contentUsageData = [];
    const artistRegex = /\| (?:\[!\[\]\[FA\]\]\(https:\/\/osu\.ppy\.sh\/beatmaps\/artists\/\d+\) \| \[([^\]]+)\]\((https:\/\/osu\.ppy\.sh\/beatmaps\/artists\/\d+)\)|([^|]+)) \| !\[\]\[(true|partial|false)\] (?:\[\^([^\]]+)\] )?\|(?:([^|]+) \|)?/;
    for (const line of lines) {
        const match = line.match(artistRegex);
        if (!match)
            continue;

        const name = match[1] ?? match[3];
        const link = match[2] ?? undefined;
        const status = wikiStatusToContentUsageStatus[match[4]] ?? "unknown";
        let notes = match[6] ?? "";
        if (match[5] && lines.find(l => l.startsWith(`[^${match[5]}]:`)))
            notes += lines.find(l => l.startsWith(`[^${match[5]}]:`))!.replace(`[^${match[5]}]: `, "");
        contentUsageData.push({ name, link, status, notes });
    }

    return contentUsageData;
}