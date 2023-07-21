import { ChatInputCommandInteraction, Message, ThreadChannel } from "discord.js";
import respond from "./respond";
import { threadNameRegex } from "./tournamentFunctions/getCustomThread";

interface ParamTypeMap {
    boolean: boolean | null;
    integer: number | null;
    number: number | null;
    string: string | null;
    channel: string | null;
    role: string | null;
    // Add more types as needed
}

const slashCommandParameterMethods: { [K in keyof ParamTypeMap]: (m: ChatInputCommandInteraction, name: string) => ParamTypeMap[K] } = {
    boolean: (m, name) => m.options.getBoolean(name),
    integer: (m, name) => m.options.getInteger(name),
    number: (m, name) => m.options.getNumber(name),
    string: (m, name) => m.options.getString(name)?.trim() || null,
    channel: (m, name) => m.options.getChannel(name)?.id || null,
    role: (m, name) => m.options.getRole(name)?.id || null,
    // Add more methods as needed
};

const messageCommandParameterMethods: { [K in keyof ParamTypeMap]: (name: string | null | undefined, parameterOption?: parameterOptions) => ParamTypeMap[K] | undefined } = {
    boolean: (name, parameterOption) => name && parameterOption ? 
        name.toLowerCase().startsWith(`-${parameterOption.name.toLowerCase()}`) || 
        name.toLowerCase().startsWith(`-${parameterOption.shortName?.toLowerCase()}`) : 
        false,
    integer: (name) => name ? parseInt(name) : undefined,
    number: (name) => name ? parseFloat(name) : undefined,
    string: (name) => name?.trim(),
    channel: (name) => name?.replace(/<#|>/g, ""),
    role: (name) => name?.replace(/<@&|>/g, ""),
    // Add more methods as needed
};

type customHandlerType = (m: Message | ChatInputCommandInteraction, index: number) => string | number | boolean | Date | null | undefined;

interface parameterOptions {
    name: string,
    paramType: keyof ParamTypeMap;
    shortName?: string,
    optional?: boolean,
    customHandler?: customHandlerType,
    postProcess?: (parameter: string) => { [key: string]: string | number | undefined } | undefined,
}

const quotes = ["'", "\"", "`"];

// Separate by spaces and quotes
export function separateArgs (str: string) {
    const args: string[] = [];
    let current = "";
    let quoteChar: string | null = null;

    for (const char of str)
        if (quoteChar) {
            if (char === quoteChar) {
                quoteChar = null;
                args.push(current);
                current = "";
            } else
                current += char;
        } else if (quotes.includes(char))
            quoteChar = char;
        else if (char !== " ")
            current += char;
        else if (current !== "") {
            args.push(current);
            current = "";
        }

    if (current !== "")
        args.push(current);

    return args;
}

function extractThreadParameter (channel: ThreadChannel, parameterOption: parameterOptions): string | undefined {
    const threadName = channel.name;
    const threadNameMatch = threadName.match(threadNameRegex);
    if (!threadNameMatch)
        return;

    if (parameterOption.name === "pool")
        return threadNameMatch[1];
    if (parameterOption.name === "slot")
        return threadNameMatch[2];

    return;
}

export function extractParameter (m: Message | ChatInputCommandInteraction, parameterOption: parameterOptions, index: number) {
    if (parameterOption.customHandler)
        return parameterOption.customHandler(m, index);

    if (m instanceof Message)
        return messageCommandParameterMethods[parameterOption.paramType](separateArgs(m.content)[index], parameterOption);

    if (slashCommandParameterMethods[parameterOption.paramType])
        return slashCommandParameterMethods[parameterOption.paramType](m, parameterOption.name);

    return m.options.get(parameterOption.name)?.value;
}

function missingParameter (m: Message | ChatInputCommandInteraction, parameterOption: parameterOptions) {
    if (parameterOption.optional)
        return false;
    respond(m, `Missing or invalid parameter \`${parameterOption.name}\``);
    return true;
}

function invalidParameter (param: any | undefined | null, optional?: boolean) {
    if (optional) return false;

    return param === undefined || 
        param === null || 
        (typeof param === "number" && isNaN(param)) || 
        (typeof param === "string" && param.trim() === "") ||
        (param instanceof Date && isNaN(param.getTime()));
}

export function extractParameters<T> (m: Message | ChatInputCommandInteraction, parameterOptions: parameterOptions[]) {
    const parameters: T = {} as T;
    let useThreadName = false;

    if (
        m instanceof Message && 
        m.channel?.isThread() && 
        parameterOptions.some(p => p.name === "pool" || p.name === "slot") &&
        parameterOptions.filter(p => !p.optional || p.name === "pool" || p.name === "slot").length >= separateArgs(m.content).length
    ) {
        useThreadName = true;
        const nonPoolSlotFilter = parameterOptions.filter(p => p.name !== "pool" && p.name !== "slot");
        const poolSlotFilter = parameterOptions.filter(p => p.name === "pool" || p.name === "slot");
        parameterOptions = [...nonPoolSlotFilter, ...poolSlotFilter];
    }
    
    let index = 1;
    for (const parameterOption of parameterOptions) {
        let parameter = extractParameter(m, parameterOption, index);

        if (parameter !== undefined && parameterOption.name === "pool")
            useThreadName = false;

        if (parameter === undefined && m.channel?.isThread() && useThreadName)
            parameter = extractThreadParameter(m.channel, parameterOption);

        if (invalidParameter(parameter, parameterOption.optional)) {
            missingParameter(m, parameterOption);
            return;
        }

        if (parameter !== undefined && parameter !== null && parameter !== false)
            index++;

        if (typeof parameter === "string" && parameterOption.postProcess) {
            const postProcess = parameterOption.postProcess(parameter);
            if (!parameterOption.optional && 
                (
                    postProcess === undefined || 
                    Object.values(postProcess).some(v => invalidParameter(v))
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