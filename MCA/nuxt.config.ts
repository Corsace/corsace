import { NuxtConfig } from "@nuxt/types";
import nuxtConfig from "../MCA-AYIM/nuxt.base.config";

export default {
    ...nuxtConfig("mca"),
    head: {
        title: "Mappers' Choice Awards",
        link: [
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700;1,900&display=swap" },
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css?family=Lexend+Peta&display=swap" },
            { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        ],
        meta: [
            { charset: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { hid: "description", name: "description", content: "Mappers' Choice Awards is the osu!-related awards event for ranked mappers and members of the mapping community to decide what the beatmaps and who the best users were each year." },
            { hid: "og:title", property: "og:title", content: "Mappers' Choice Awards" },
            { hid: "og:type", property: "og:type", content: "website" },
            { hid: "og:url", property: "og:url", content: "https://mca.corsace.io" },
            { hid: "og:description", property: "og:description", content: "Mappers' Choice Awards is the osu!-related awards event for ranked mappers and members of the mapping community to decide what the beatmaps and who the best users were each year." },
            { hid: "og:site_name", property: "og:site_name", content: "MCA" },
            { hid: "theme-color", name: "theme-color", content: "#fb2475" },
        ],
    },
} as NuxtConfig;
