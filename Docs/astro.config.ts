import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { config } from "node-config-ts";

const locales: Record<string, {
        label: string;
        lang: string;
    }> = {
        en: {
            label: "English",
            lang: "en",
        },
        br: {
            label: "Português (Brasil)",
            lang: "pt-BR",
        },
        cn: {
            label: "简体中文",
            lang: "zh-CN",
        },
        de: {
            label: "Deutsch",
            lang: "de",
        },
        es: {
            label: "Español",
            lang: "es",
        },
        fr: {
            label: "Français",
            lang: "fr",
        },
        gr: {
            label: "Ελληνικά",
            lang: "el",
        },
        id: {
            label: "Bahasa Indonesia",
            lang: "id",
        },
        it: {
            label: "Italiano",
            lang: "it",
        },
        jp: {
            label: "日本語",
            lang: "ja",
        },
        kr: {
            label: "한국어",
            lang: "ko",
        },
        nl: {
            label: "Nederlands",
            lang: "nl",
        },
        pl: {
            label: "Polski",
            lang: "pl",
        },
        ru: {
            label: "Русский",
            lang: "ru",
        },
        vn: {
            label: "Tiếng Việt",
            lang: "vi",
        },
    };

// https://astro.build/config
export default defineConfig({
    server: {
        host: config.docs.host,
        port: config.docs.port,
    },
    publicDir: "../Assets/static",
    site: config.docs.publicUrl,
    redirects: {
        "/": {
            status: 308,
            destination: "/en",
        },
    },
    integrations: [
        starlight({
            editLink: {
                baseUrl: "https://github.com/Corsace/Corsace/blob/master/Docs",
            },
            title: "Corsace Documentation",
            social: {
                discord: "https://discord.gg/Z6vEMsr",
                github: "https://github.com/corsace/corsace",
                twitch: "https://www.twitch.tv/corsace",
                twitter: "https://twitter.com/corsace_",
                youtube: "https://youtube.com/corsace",
            },
            tableOfContents: {
                minHeadingLevel: 1,
                maxHeadingLevel: 5,
            },
            favicon: "/favicon.ico",
            defaultLocale: "en",
            locales,
            customCss: [
                "./src/styles/custom.scss",
                "./src/fonts/font-face.scss",
            ],
            lastUpdated: true,
            // Only tournament_play content is localized
            // All other documentation is English-only
            sidebar: [
                {
                    label: "Playing Tournaments",
                    translations: {
                        en: "Playing Tournaments",
                        br: "Participando de Torneios",
                        cn: "参加比赛",
                        de: "Teilnahme an Turnieren",
                        es: "Participando en Torneos",
                        fr: "Participer aux Tournois",
                        gr: "Συμμετοχή σε Τουρνουά",
                        id: "Bermain di Turnamen",
                        it: "Partecipare ai Tornei",
                        jp: "トーナメントに参加する",
                        kr: "토너먼트 참가하기",
                        nl: "Deelnemen aan Toernooien",
                        pl: "Uczestnictwo w Turniejach",
                        ru: "Участие в турнирах",
                        vn: "Tham gia Giải đấu",
                    },
                    autogenerate: { directory: "tournament_play", collapsed: true, }
                },
                {
                    label: "Running Tournaments (English Only)",
                    link: "/tournament_org/",
                    translations: {
                        en: "Running Tournaments",
                        "*": "Running Tournaments (English Only)",
                    },
                },
                {
                    label: "Development (English Only)",
                    link: "/development/",
                    translations: {
                        en: "Development",
                        "*": "Development (English Only)",
                    },
                },
                {
                    label: "Design",
                    link: "https://figma.com/design/7TIFgrC3xanb14A3GTDllb",
                },
            ],
        }),
    ],
});
