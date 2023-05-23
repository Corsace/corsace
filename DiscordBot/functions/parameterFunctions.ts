import { ChatInputCommandInteraction, Message } from "discord.js";
import respond from "./respond";

interface ParamTypeMap {
    boolean: boolean | null;
    integer: number | null;
    number: number | null;
    string: string | null;
    // Add more types as needed
}

const slashCommandParameterMethods: { [K in keyof ParamTypeMap]: (m: ChatInputCommandInteraction, name: string) => ParamTypeMap[K] } = {
    boolean: (m, name) => m.options.getBoolean(name),
    integer: (m, name) => m.options.getInteger(name),
    number: (m, name) => m.options.getNumber(name),
    string: (m, name) => m.options.getString(name),
    // Add more methods as needed
};

const messageCommandParameterMethods: { [K in keyof ParamTypeMap]: (name: string | null | undefined) => ParamTypeMap[K] | undefined } = {
    boolean: (name) => name ? true : false,
    integer: (name) => name ? parseInt(name) : undefined,
    number: (name) => name ? parseFloat(name) : undefined,
    string: (name) => name,
    // Add more methods as needed
};

type customHandlerType = (m: Message | ChatInputCommandInteraction) => string | number | boolean | Date | null | undefined;

interface parameterOptionsBase {
    name: string,
    optional?: boolean,
    customHandler?: customHandlerType,
    postProcess?: (parameter: string) => { [key: string]: string | number } | undefined,
};

interface messageParameterOptions extends parameterOptionsBase {
    regex: RegExp,
    regexIndex: number,
    paramType?: keyof ParamTypeMap;
    customHandler: undefined,
};

export type parameterOptions = parameterOptionsBase | messageParameterOptions;

export function extractParameter (m: Message | ChatInputCommandInteraction, parameterOption: parameterOptions, index: number) {
    if (parameterOption.customHandler)
        return parameterOption.customHandler(m);

    if ("regexIndex" in parameterOption) {
        if (m instanceof Message) {
            const param = m.content.match(parameterOption.regex)?.[parameterOption.regexIndex] ?? m.content.split(" ")[index];
            return messageCommandParameterMethods[parameterOption.paramType || "string"](param);
        }

        if (parameterOption.paramType && slashCommandParameterMethods[parameterOption.paramType])
            return slashCommandParameterMethods[parameterOption.paramType](m, parameterOption.name);

        return m.options.get(parameterOption.name)?.value;
    }

    return;
}

function missingParameter (m: Message | ChatInputCommandInteraction, parameterOption: parameterOptions) {
    if (parameterOption.optional)
        return false;
    respond(m, `Missing parameter \`${parameterOption.name}\`.`);
    return true;
}

export function extractParameters<T>(m: Message | ChatInputCommandInteraction, parameterOptions: parameterOptions[]) {
    const parameters: T = {} as T;

    let index = 1;
    for (const parameterOption of parameterOptions) {
        const parameter = extractParameter(m, parameterOption, index);

        if (!parameterOption.optional && 
            (
                parameter === undefined || 
                parameter === null || 
                (typeof parameter === "number" && isNaN(parameter))
            )
        ) {
            missingParameter(m, parameterOption);
            return;
        }

        if ("regexIndex" in parameterOption)
            index++;

        if (typeof parameter === "string" && parameterOption.postProcess) {
            const postProcess = parameterOption.postProcess(parameter);
            if (!parameterOption.optional && 
                (
                    postProcess === undefined || 
                    Object.values(postProcess).some(v => typeof v === "number" && isNaN(v))
                )
            ) {
                missingParameter(m, parameterOption);
                return;
            }

            for (const key in postProcess) {
                parameters[key] = postProcess[key];
            }
            continue;
        }
        
        parameters[parameterOption.name] = parameter;
    }

    return parameters;
}