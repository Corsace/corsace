import { CorsaceRouter } from "../../../corsaceRouter";
import { config } from "node-config-ts";
import { redirectToMainDomain } from "../../../middleware/login";
import { parseQueryParam } from "../../../utils/query";

const twitchRouter  = new CorsaceRouter();

twitchRouter.$get("/", redirectToMainDomain, ctx => {
    const site = parseQueryParam(ctx.query.site);
    if (!site) {
        ctx.body = {
            success: false,
            error: "No site specified",
        };
        return;
    }
    if (!(site in config)) {
        ctx.body = {
            success: false,
            error: "Invalid site",
        };
        return;
    }
    const configInfo = config[site as keyof typeof config];
    if (typeof configInfo === "object" && !("publicUrl" in configInfo)) {
        ctx.body = {
            success: false,
            error: "Invalid config",
        };
        return;
    }

    const baseURL = ctx.query.site ? (typeof configInfo === "object" ? configInfo.publicUrl : config.corsace.publicUrl) : "";
    const params = parseQueryParam(ctx.query.redirect) ?? "";
    const redirectURL = (baseURL + params) ?? "back";
    ctx.cookies.set("redirect", redirectURL, { overwrite: true });
    ctx.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${config.twitch.clientId}&redirect_uri=${config.corsace.publicUrl}/api/login/twitch/callback&response_type=code&scope=chat:read+chat:edit`);
});

twitchRouter.$get("/callback", ctx => {
    if (!ctx.query.code) {
        ctx.body = {
            success: false,
            error: "No code provided",
        };
        return;
    }

    const code = ctx.query.code;
    console.log(code);

    const redirect = ctx.cookies.get("redirect");
    ctx.cookies.set("redirect", "");
    ctx.redirect(redirect ?? "back");
});

export default twitchRouter;