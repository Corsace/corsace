import { Config } from "../config";
import * as fs from "fs";

const config = new Config;
const locales: any[] = [];

fs.readdirSync("../CorsaceAssets/lang").forEach(file => {
    if (file !== "example.json" && file !== "index.js")
        locales.push({
            code: file.split(".")[0],
            file,
        });
});

export default {
    serverMiddleware: ["~/api"],
    buildModules: ["@nuxt/typescript-build"],
    server: {
        host: config.ayim.host,
        port: config.ayim.port,
    },
    modules: [
        [
            "nuxt-i18n",
            {
                locales,
                defaultLocale: "en",
                strategy: "no_prefix",
                lazy: true,
                langDir: "../CorsaceAssets/lang/",
                vueI18n: {
                    fallbackLocale: "en",
                },
            },
        ],
    ],
    head: {
        link: [
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700;1,900&display=swap" },
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css?family=Lexend+Peta&display=swap" },
        ],
    },
    css: [
        "@/assets/main.scss",
    ],
};