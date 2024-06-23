import { writeFileSync } from "fs";
import { Project } from "ts-morph";

export function configExport () {
    const project = new Project();
    const filePath = "./config/Config.d.ts";
    const sourceFile = project.addSourceFileAtPath(filePath);

    const interfaces: Record<string, { name: string; type: string }[]> = {};
        
    sourceFile.getModules()[0].getInterfaces().forEach((iface) => {
        const name = iface.getName();
        const properties = iface.getProperties().map((prop) => {
            return {
                name: prop.getName(),
                type: prop.getType().getText(),
            };
        });
        interfaces[name] = properties;
    });

    writeFileSync("./src/data/config.json", JSON.stringify(interfaces, null, 2));
}