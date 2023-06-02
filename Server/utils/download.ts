import * as https from "https";
import { PassThrough, Readable } from "stream";

export function download (url: string): Readable {
    const passThrough = new PassThrough();
    https.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
            passThrough.emit("error", new Error(`HTTP Error ${res.statusCode}`));
            return;
        }
        res.pipe(passThrough);
    }).on("error", (err) => passThrough.emit("error", err));
    return passThrough;
}
