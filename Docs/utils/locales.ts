import { readFileSync, readdirSync } from "fs";
import { basename, extname, join } from "path";

type localeDict = Record<string, {
    label: string;
    lang?: string;
}>;

export function locales (): localeDict {
    const locales: localeDict = {
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

    return locales;
}