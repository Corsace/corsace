import axios from "axios";
import { PassThrough, Readable } from "stream";
import { RateLimiterMemory, RateLimiterQueue } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterQueue(new RateLimiterMemory({ points: 1, duration: 2 }));

export function download (url: string): Readable {
    const passThrough = new PassThrough();
    rateLimiter.removeTokens(1, new URL(url).hostname)
        .then(() => axios.get(url,{
            responseType: "stream",
        }
        ))
        .then((res) => (res.data as Readable).pipe(passThrough))
        .catch((err) => passThrough.emit("error", err));
    return passThrough;
}
