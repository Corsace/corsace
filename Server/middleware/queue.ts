import { queue } from "async";
import { Next } from "koa";

export function queueRequests (concurrency: number) {
    const q = queue((next: Next, cb) => {
        next().then(() => cb(), cb);
    }, concurrency);
    return (ctx: unknown, next: Next) => q.push(next);
}
