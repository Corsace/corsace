import * as fs from "fs";
import path from "path";

const locales: any[] = [];

fs.readdirSync("../Assets/lang").forEach(file => {
    if (file !== "example.json" && file !== "flagCodes.json")
        locales.push({
            code: file.split(".")[0],
            file,
        });
});

export default {
    watch: ["~/api"],
    serverMiddleware: ["~/api"],
    buildModules: ["@nuxt/typescript-build"],
    modules: [
        "@nuxtjs/axios",
        [
            "nuxt-i18n",
            {
                locales,
                defaultLocale: "en",
                strategy: "no_prefix",
                lazy: true,
                langDir: "../Assets/lang/",
                vueI18n: {
                    fallbackLocale: "en",
                },
            },
        ],
    ],
    css: [
        "../MCA-AYIM/assets/sass/main.scss",
    ],
    build: {
        extend (config) {
            config.resolve.alias["@s-sass"] = path.join(__dirname, "../MCA-AYIM/assets/sass");
            config.resolve.alias["../../MCA-AYIM/components"] = path.join(__dirname, "../MCA-AYIM/components");
        },
    },
};
