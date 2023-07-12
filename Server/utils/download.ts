import * as https from "https";
import { PassThrough, Readable } from "stream";

export function download (url: string): Readable {
    const passThrough = new PassThrough();
    https.get(url, (res) => {
        res.pipe(passThrough);
    }).on("error", (err) => passThrough.emit("error", err));
    return passThrough;
}
