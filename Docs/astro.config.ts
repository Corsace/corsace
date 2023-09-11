import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { config } from "node-config-ts";
import { readdirSync, readFileSync } from "fs";
import { basename, extname, join } from "path";

const locales: {
    [dir: string]: {
        label: string;
        lang?: string;
    }
} = {
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
    integrations: [
        starlight({
            editLink: {
                baseUrl: "https://github.com/Corsace/Corsace/Docs",
            },
            title: "Corsace Documentation",
            social: {
                discord: "https://discord.gg/Z6vEMsr",
                github: "https://github.com/corsace/corsace",
                twitch: "https://www.twitch.tv/corsace",
                twitter: "https://twitter.com/corsace_",
                youtube: "https://youtube.com/corsace",
            },
            favicon: "/favicon.ico",
            defaultLocale: "en",
            locales,
            customCss: [
                "./src/styles/custom.scss",
            ],
            sidebar: [
                {
                    label: "Design",
                    autogenerate: { directory: "design" },
                },
                {
                    label: "Development",
                    autogenerate: { directory: "development" },
                },
                {
                    label: "Running Tournaments",
                    autogenerate: { directory: "tournaments" },
                },
            ],
        }),
    ],
});
