import { NuxtConfig } from "@nuxt/types";
import * as fs from "fs";
import { config } from "node-config-ts";
import path from "path";
import setSpa from "./serverMiddlewares/setSpa";

const locales: any[] = [];

fs.readdirSync("../Assets/lang").forEach(file => {
    if (file !== "example.json" && file !== "flagCodes.json" && file !== "index.js")
        locales.push({
            code: file.split(".")[0],
            file,
        });
});

export default (subSite: string): Partial<NuxtConfig> => ({
    watch: ["~/api"],
    serverMiddleware: [setSpa(subSite), "~/api"],
    buildModules: ["@nuxt/typescript-build"],
    server: {
        host: config[subSite].host,
        port: config[subSite].port,
    },
    modules: [
        "@nuxtjs/axios",
        [
            "nuxt-i18n",
            {
                locales,
                defaultLocale: "en",
                strategy: "no_prefix",
                lazy: true,
                langDir: "../Assets/lang/",
                vueI18n: {
                    fallbackLocale: "en",
                },
            },
        ],
    ],
    css: [
        "../MCA-AYIM/assets/sass/main.scss",
    ],
    build: {
        optimizeCSS: true,
        extend (config) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            config.resolve!.alias!["@s-sass"] = path.join(__dirname, "../MCA-AYIM/assets/sass");
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            config.resolve!.alias!["../../MCA-AYIM/components"] = path.join(__dirname, "../MCA-AYIM/components");
        },
    },
    dir: {
        static: "../Assets/static",
    },
    axios: {
        browserBaseURL: "/",
    },
});
