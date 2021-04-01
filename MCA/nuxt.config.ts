import { NuxtConfig } from "@nuxt/types";
import nuxtConfig from "../MCA-AYIM/nuxt.base.config";

export default {
    ...nuxtConfig("mca"),
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
                content: "MCA",
            },
        ],
    },
} as NuxtConfig;
