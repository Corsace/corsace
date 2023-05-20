import { ChatInputCommandInteraction, Message } from "discord.js";
import respond from "./respond";

type customHandlerType = (m: Message | ChatInputCommandInteraction) => string | number | null | undefined;

interface parameterOptionsBase {
    name: string,
    optional?: boolean,
    customHandler?: customHandlerType,
    postProcess?: (parameter: string) => { [key: string]: string | number } | undefined,
};

interface messageParameterOptions extends parameterOptionsBase {
    index: number,
    regex: RegExp,
    regexIndex: number,
    customHandler: undefined,
};

export type parameterOptions = parameterOptionsBase | messageParameterOptions;

export function extractParameter (m: Message | ChatInputCommandInteraction, parameterOption: parameterOptions) {
    if (parameterOption.customHandler)
        return parameterOption.customHandler(m);
    else if ("index" in parameterOption)
        return m instanceof Message ? m.content.match(parameterOption.regex)?.[parameterOption.regexIndex] ?? m.content.split(" ")[parameterOption.index] : m.options.getString(parameterOption.name);
    else
        return;
}

function missingParameter (m: Message | ChatInputCommandInteraction, parameterOption: parameterOptions) {
    if (parameterOption.optional)
        return false;
    respond(m, `Missing parameter \`${parameterOption.name}\`.`);
    return true;
}

export function extractParameters<T extends Object>(m: Message | ChatInputCommandInteraction, parameterOptions: parameterOptions[]) {
    const parameters: T = {} as T;

    for (const parameterOption of parameterOptions) {
        const parameter = extractParameter(m, parameterOption);

        if (!parameter || (typeof parameter === "number" && isNaN(parameter))) {
            if (parameterOption.optional) {
                parameters[parameterOption.name] = undefined;
                continue;
            }
            missingParameter(m, parameterOption);
            return;
        }

        if (typeof parameter === "string" && parameterOption.postProcess) {
            const postProcess = parameterOption.postProcess(parameter);
            for (const key in postProcess)
                parameters[key] = postProcess[key];
            continue;
        }
        
        parameters[parameterOption.name] = parameter;
    }

    return parameters;
}