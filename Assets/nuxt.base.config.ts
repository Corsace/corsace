import { NuxtConfig } from "@nuxt/types";
import * as fs from "fs";
import { config } from "node-config-ts";
import path from "path";

const locales: {
    code: string;
    file: string;
}[] = [
    {
        code: "en",
        file: "en.json",
    },
];

fs.readdirSync("../Assets/lang/translated").forEach(file => {
    if (file !== "index.js")
        locales.push({
            code: file.split(".")[0],
            file: `translated/${file}`,
        });
});

export default (subSite: string): Partial<NuxtConfig> => {
    if (!(subSite in config))
        throw new Error(`Invalid subSite: ${subSite}`);

    const subSiteConfig = subSite as keyof typeof config;
    const configObj = config[subSiteConfig];
    if (typeof configObj !== "object")
        throw new Error(`Invalid subSite: ${subSite} - config.subSite is not an object`);

    if (!("ssr" in configObj))
        throw new Error(`Invalid subSite: ${subSite} - no ssr property found`);


    return {
        buildModules: ["@nuxt/typescript-build"],
        server: {
            host: configObj.host,
            port: configObj.port,
        },
        ssr: configObj.ssr,
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
            "../Assets/sass/main.scss",
        ],
        build: {
            optimizeCSS: true,
            extend (config) {
                config.resolve!.alias!["@s-sass"] = path.join(__dirname, "../Assets/sass");
                config.resolve!.alias!["../../Assets/components"] = path.join(__dirname, "../Assets/components");
            },
        },
        dir: {
            static: "../Assets/static",
        },
        axios: {
            proxy: true,
            headers: {
                common: {
                    // Allow secure cookies to be set by the `cookies` module
                    "X-Forwarded-Proto": "https",
                },
            },
        },
        proxy: {
            "/api/": config.api.publicUrl,
        },
    };
};
