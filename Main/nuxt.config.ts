import { NuxtConfig } from "@nuxt/types";
import nuxtConfig from "../Assets/nuxt.base.config";

export default {
    ...nuxtConfig("corsace"),
    head: {
        title: "Corsace",
        link: [
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700;1,900&display=swap" },
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css?family=Lexend+Peta&display=swap" },
            { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        ],
        meta: [
            { charset: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { hid: "description", name: "description", content: "Corsace is a series of projects (primarily osu!-related) led by VINXIS which consists of tournaments, events, projects, and many more!" },
            { hid: "og:title", property: "og:title", content: "Corsace" },
            { hid: "og:type", property: "og:type", content: "website" },
            { hid: "og:url", property: "og:url", content: "https://corsace.io" },
            { hid: "og:description", property: "og:description", content: "Corsace is a series of projects (primarily osu!-related) led by VINXIS which consists of tournaments, events, projects, and many more!" },
            { hid: "og:site_name", property: "og:site_name", content: "Corsace" },
            { hid: "theme-color", name: "theme-color", content: "#e98792" },
        ],
    },
} as NuxtConfig;
