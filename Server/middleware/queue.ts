import { queue } from "async";
import { DefaultState, Next } from "koa";
import { CorsaceContext } from "../corsaceRouter";

export function queueRequests<S extends DefaultState = DefaultState> (concurrency: number) {
    const q = queue((next: Next, cb) => {
        next().then(() => cb(), cb);
    }, concurrency);
    return (ctx: CorsaceContext<object, S>, next: Next) => q.push(next);
}
