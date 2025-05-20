import { NuxtConfig } from "@nuxt/types";
import { ISubSiteConfig, config } from "node-config-ts";
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

export default (subSite: string): Partial<NuxtConfig> => {
    if (!(subSite in config))
        throw new Error(`Invalid subSite: ${subSite}`);

    const subSiteConfig = subSite as keyof typeof config;
    const configObj = config[subSiteConfig] as ISubSiteConfig;
    if (typeof configObj !== "object")
        throw new Error(`Invalid subSite: ${subSite} - config.subSite is not an object`);


    return {
        buildModules: ["@nuxt/typescript-build"],
        server: {
            host: configObj.host,
            port: configObj.port,
        },
        ssr: !["0", "false", ""].includes(`${configObj.ssr}`.toLowerCase()),
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
            extend (c) {
                c.resolve!.alias!["@s-sass"] = path.join(__dirname, "../Assets/sass");
                c.resolve!.alias!["../../Assets/components"] = path.join(__dirname, "../Assets/components");
            },
        },
        dir: {
            static: "../Assets/static",
        },
        axios: {
            proxy: true,
            host: "127.0.0.1",
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
