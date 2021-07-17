import { NuxtConfig } from "@nuxt/types";
import * as fs from "fs";
import { config } from "node-config-ts";
import path from "path";

const locales: any[] = [];

fs.readdirSync("../Assets/lang").forEach(file => {
    if (file !== "example.json" && file !== "flagCodes.json" && file !== "index.js")
        locales.push({
            code: file.split(".")[0],
            file,
        });
});

export default (subSite: string): Partial<NuxtConfig> => ({
    buildModules: ["@nuxt/typescript-build"],
    server: {
        host: config[subSite].host,
        port: config[subSite].port,
    },
    ssr: config[subSite].ssr,
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
            config.resolve!.alias!["@s-sass"] = path.join(__dirname, "../MCA-AYIM/assets/sass");
            config.resolve!.alias!["../../MCA-AYIM/components"] = path.join(__dirname, "../MCA-AYIM/components");
        },
    },
    dir: {
        static: "../Assets/static",
    },
    axios: {
        proxy: true,
    },
    proxy: {
        "/api/": config.api.publicUrl,
    },
});
