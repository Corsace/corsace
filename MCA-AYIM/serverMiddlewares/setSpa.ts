import { NuxtOptionsServerMiddleware } from "@nuxt/types/config/server-middleware";
import { config } from "node-config-ts";

// https://blog.lichter.io/posts/nuxt-dynamic-ssr-spa-handling/
export default (subSite: string): NuxtOptionsServerMiddleware => ({
    path: "/",
    handler: (req, res, next) => {
        (res as any).spa = config[subSite].spa;
        next();
    },
});
