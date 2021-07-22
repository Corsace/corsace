import { config } from "node-config-ts";
import { ParameterizedContext, Next } from "koa";

const mainHost = new URL(config.corsace.publicUrl).host;

export async function redirectToMainDomain (ctx: ParameterizedContext, next: Next): Promise<void> {
    // Redirect to the main host (where user gets redirected post-oauth) to apply redirect cookie on the right domain
    if(ctx.host !== mainHost) {
        ctx.redirect(`${config.corsace.publicUrl}${ctx.originalUrl}`);
        return;
    }
    await next();
}
