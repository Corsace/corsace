import { osuV2WikiPage } from "../../Interfaces/osuAPIV2";
import { osuV2Client } from "./index";

export type contentUsageStatus = "allowed" | "disallowed" | "unknown" | "allowed with exceptions";

const refreshTime = 1000 * 60 * 60; // 1 hour

const wikiData: {
    lastRetrieved: Date;
    data: osuV2WikiPage;
    path: string;
}[] = [];

let contentUsageData: {
    name: string;
    link?: string;
    status: contentUsageStatus;
    notes?: string;
}[] = [];

const wikiStatusToContentUsageStatus: Record<string, contentUsageStatus> = {
    "true": "allowed",
    "false": "disallowed",
    "partial": "allowed with exceptions",
};

export async function getWikiPage (path: string, locale?: string) {
    let wikiPage = wikiData.find(w => w.path === path);
    if (!wikiPage?.data || !wikiPage.lastRetrieved || new Date().getTime() - wikiPage.lastRetrieved.getTime() >= refreshTime) {
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
    if (wikiPage && new Date().getTime() - wikiPage.lastRetrieved.getTime() < refreshTime)
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

    // Safety checks, since this is kinda scraping, may break at any time.
    const unknownStatus = contentUsageData.filter(c => c.status === "unknown");
    if (unknownStatus.length > 0) {
        throw new Error(`Detected ${unknownStatus.length} unknown content usage statuses.`);
    }

    const allowedStatus = contentUsageData.filter(c => c.status === "allowed");
    if (allowedStatus.length < 300) {
        throw new Error(`Detected ${allowedStatus.length} allowed content usage statuses.`);
    }

    const allowedWithExceptionsStatus = contentUsageData.filter(c => c.status === "allowed with exceptions");
    if (allowedWithExceptionsStatus.length > 20) {
        throw new Error(`Detected ${allowedWithExceptionsStatus.length} allowed with exceptions content usage statuses.`);
    }

    const disallowedStatus = contentUsageData.filter(c => c.status === "disallowed");
    if (disallowedStatus.length > 20) {
        throw new Error(`Detected ${disallowedStatus.length} disallowed content usage statuses.`);
    }

    return contentUsageData;
}