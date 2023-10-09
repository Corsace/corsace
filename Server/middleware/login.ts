import { config } from "node-config-ts";
import { Next, DefaultState } from "koa";
import { CorsaceContext } from "../corsaceRouter";

const mainHost = new URL(config[process.env.NODE_ENV === "production" ? "corsace" : "api"].publicUrl).host;

export async function redirectToMainDomain<S extends DefaultState = DefaultState> (ctx: CorsaceContext<object, S>, next: Next): Promise<void> {
    // Redirect to the main host (where user gets redirected post-oauth) to apply redirect cookie on the right domain
    if(ctx.host !== mainHost) {
        ctx.redirect(`${config[process.env.NODE_ENV === "production" ? "corsace" : "api"].publicUrl}${ctx.originalUrl}`);
        return;
    }
    await next();
}
