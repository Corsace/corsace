import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { config } from "node-config-ts";
import { locales } from "./utils/locales";
import { configExport } from "./utils/config";

// Extract all interfaces from the Config.d.ts file
configExport();
console.log("Interfaces extracted to config.json");

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
            locales: locales(),
            customCss: [
                "./src/styles/custom.scss",
                "./src/fonts/font-face.scss",
            ],
            lastUpdated: true,
            sidebar: [
                {
                    label: "Running Tournaments",
                    autogenerate: { directory: "tournaments", collapsed: true },
                },
                {
                    label: "Development",
                    autogenerate: { directory: "development", collapsed: true },
                },
                {
                    label: "Design",
                    autogenerate: { directory: "design", collapsed: true },
                },
            ],
        }),
    ],
});
