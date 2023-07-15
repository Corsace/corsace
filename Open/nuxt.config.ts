import { NuxtConfig } from "@nuxt/types";
import nuxtConfig from "../Assets/nuxt.base.config";

export default {
    ...nuxtConfig("open"),
    head: {
        title: "Corsace Open",
        link: [
            { rel: "icon", type: "image/x-icon", href: "/open/favicon.ico" },
            { rel: "icon", type: "image/x-icon", href: "/open/favicon.png" },
        ],
        meta: [
            { charset: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { hid: "description", name: "description", content: "Corsace Open is one of the largest 4v4 tournaments in osu! Hailing great competition and entertaining matches." },
            { hid: "og:title", property: "og:title", content: "Corsace Open" },
            { hid: "og:type", property: "og:type", content: "website" },
            { hid: "og:url", property: "og:url", content: "https://open.corsace.io" },
            { hid: "og:description", property: "og:description", content: "Corsace Open is one of the largest 4v4 tournaments in osu! Hailing great competition and entertaining matches." },
            { hid: "og:site_name", property: "og:site_name", content: "CO" },
            { hid: "theme-color", name: "theme-color", content: "#F24141" },
        ],
    },
} as NuxtConfig;
