import * as https from "https";
import { PassThrough, Readable } from "stream";

export async function download (url: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
        const passThrough = new PassThrough();

        https.get(url, (res) => {
            if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`HTTP Error ${res.statusCode} from ${url}`));
                return;
            }
            res.pipe(passThrough);
            resolve(passThrough);
        });
    });
}
