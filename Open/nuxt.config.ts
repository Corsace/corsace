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
            { name: "viewport", content: "width=1024" },
            // { name: "viewport", content: "width=device-width, initial-scale=1" }, TODO: Fix mobile

            { property: "og:site_name", content: "Corsace Open" },
            { hid: "theme-color", name: "theme-color", content: "#F24141" },

            { hid: "og:url", property: "og:url", content: "https://open.corsace.io"},
            { hid: "og:type", property: "og:type", content: "website"},

            { hid: "og:locale", property: "og:locale", content: "en_US"},

            { property: "og:locale:alternate", content: "cn_HK" },
            { property: "og:locale:alternate", content: "de_DE" },
            { property: "og:locale:alternate", content: "es_ES" },
            { property: "og:locale:alternate", content: "fr_FR" },
            { property: "og:locale:alternate", content: "id_ID" },
            { property: "og:locale:alternate", content: "ja_JP" },
            { property: "og:locale:alternate", content: "ko_KR" },
            { property: "og:locale:alternate", content: "nl_NL" },

            
            { hid: "og:image:width", property: "og:image:width", content: "547" },
            { hid: "og:image:height", property: "og:image:height", content: "223" },
            { hid: "og:image:type", property: "og:image:type", content: "image/png" },
            { hid: "og:image:alt", property: "og:image:alt", content: "Corsace Open" },
            
            { name: "twitter:site", content: "@corsace_" },
            { name: "twitter:domain", content: "https://open.corsace.io" },
            { name: "twitter:card", content: "summary_large_image" },

            {hid: "keywords", property: "keywords", content: "corsace, corsace open, osu!, tournament, qualifiers, teams"},
        ],
    },
} as NuxtConfig;
