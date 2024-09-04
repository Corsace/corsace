import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { config } from "node-config-ts";
import { readdirSync, readFileSync } from "fs";
import { basename, extname, join } from "path";

const locales: Record<string, {
        label: string;
        lang?: string;
    }> = {
        en: {
            label: "English",
        },
    };

const dir = "../Assets/lang/translated";
const files = readdirSync(dir);
files.forEach(file => {
    if (extname(file) !== ".json")
        return;

    const filePath = join(dir, file);
    const content = readFileSync(filePath, "utf8");

    const json = JSON.parse(content);

    const fileNameWithoutExtension = basename(file, ".json");

    locales[fileNameWithoutExtension] = {
        label: json.language,
    };
});

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
            sidebar: [
                {
                    label: "Running Tournaments",
                    autogenerate: { directory: "tournament_org", collapsed: true },
                },
                {
                    label: "Playing Tournaments",
                    autogenerate: { directory: "tournament_play", collapsed: true },
                },
                {
                    label: "Development",
                    autogenerate: { directory: "development", collapsed: true },
                },
                {
                    label: "Design",
                    link: "https://figma.com/design/7TIFgrC3xanb14A3GTDllb",
                },
            ],
        }),
    ],
});
