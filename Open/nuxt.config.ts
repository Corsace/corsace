import { config } from "node-config-ts";
import * as fs from "fs";
import path from "path";

const locales: any[] = [];

fs.readdirSync("../Assets/lang").forEach(file => {
    if (file !== "example.json" && file !== "flagCodes.json" && file !== "index.js")
        locales.push({
            code: file.split(".")[0],
            file,
        });
});

export default {
    server: {
        host: config.open.host,
        port: config.open.port,
    },
    ssr: config.open.ssr,
    head: {
        link: [
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700;1,900&display=swap" },
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css?family=Lexend+Peta&display=swap" },
            { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        ],
        meta: [
            { charset: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            {
                hid: "description",
                name: "description",
                content: "Corsace Open",
            },
        ],
    },
    buildModules: ["@nuxt/typescript-build"],
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
        "./assets/main.scss",
    ],
    build: {
        extend (config) {
            config.resolve.alias["@s-sass"] = path.join(__dirname, "../MCA-AYIM/assets/sass");
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
};
