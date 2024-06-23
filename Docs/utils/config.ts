import { writeFileSync } from "fs";
import { Project, PropertySignature, Type, ts } from "ts-morph";

interface Property {
    name: string;
    type: string | Property[];
}

/**
 * Process the properties of an object that is not a named interface
 * @param {Type} type The type of the object
 * @returns {Property[]} The processed properties of type `Property`
 * @example
 * const properties = processNestedProperties(type);
 * console.log(properties);
 */
function processNestedProperties (type: Type): Property[] {
    const symbol = type.getSymbol();
    if (!symbol)
        return [];

    const declarations = symbol.getDeclarations();
    if (declarations.length === 0)
        return [];

    const declaration = declarations[0];
    if (declaration.isKind(ts.SyntaxKind.TypeLiteral) || declaration.isKind(ts.SyntaxKind.InterfaceDeclaration)) {
        const properties = declaration.getProperties();
        return processProperties(properties);
    }

    return [];
}

/**
 * Process the properties of an interface/object and return them as an array of Property objects
 * @param {PropertySignature} properties The properties of the interface/object
 * @returns {Property[]} The processed properties of type `Property`
 * @example
 * const properties = processProperties(iface.getProperties());
 * console.log(properties);
 */
function processProperties (properties: PropertySignature[]): Property[] {
    return properties.map((prop) => {
        const propType = prop.getType();

        // If the property is an object that is not a named interface, we need to process its properties
        if (propType.isObject() && propType.isAnonymous()) {
            const nestedProperties = processNestedProperties(propType);
            return {
                name: prop.getName(),
                type: nestedProperties,
            };
        }

        return {
            name: prop.getName(),
            type: propType.getText().replace(/import\(".*"\)\./g, ""),
        };
    });
}

/**
 * Extract all interfaces from the `~/config/Config.d.ts` file and write them to a `config.json` file
 * @example
 * configExport();
 */
export function configExport () {
    const project = new Project();
    const filePath = "./config/Config.d.ts";
    const sourceFile = project.addSourceFileAtPath(filePath);

    const interfaces: Record<string, Property[]> = {};
        
    sourceFile.getModules()[0].getInterfaces().forEach((iface) => {
        const name = iface.getName();
        const properties = processProperties(iface.getProperties());
        interfaces[name] = properties;
    });

    writeFileSync("./src/data/config.json", JSON.stringify(interfaces, null, 2));
}