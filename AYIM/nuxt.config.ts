import { NuxtConfig } from "@nuxt/types";
import nuxtConfig from "../MCA-AYIM/nuxt.base.config";

export default {
    ...nuxtConfig("ayim"),
    head: {
        title: "A Year in Mapping",
        link: [
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700;1,900&display=swap" },
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css?family=Lexend+Peta&display=swap" },
            { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        ],
        meta: [
            { charset: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { hid: "description", name: "description", content: "A Year in Mapping details the records and statistics from each year for the osu! ranked section." },
            { hid: "og:title", property: "og:title", content: "A Year in Mapping" },
            { hid: "og:type", property: "og:type", content: "website" },
            { hid: "og:url", property: "og:url", content: "https://ayim.corsace.io" },
            { hid: "og:description", property: "og:description", content: "A Year in Mapping details the records and statistics from each year for the osu! ranked section." },
            { hid: "og:site_name", property: "og:site_name", content: "AYIM" },
            { hid: "theme-color", name: "theme-color", content: "#fb2475" },
        ],
    },
    css: [
        "../MCA-AYIM/assets/sass/main.scss",
        "./assets/ayim.scss",
    ],
} as NuxtConfig;
