import * as https from "https";

export function download (url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            const chunks: Buffer[] = [];
            res.on("data", chunk => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
            res.on("error", reject);
        });
    });
}