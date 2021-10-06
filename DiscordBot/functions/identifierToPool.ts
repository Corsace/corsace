const openAcronyms = ["co", "open", "corsaceopen", "corsace open", "corsace"];
const closedAcronyms = ["cc", "closed", "corsaceclosed", "corsace closed"];

export default function identifierToPool (identifier: string): "openMappool" | "closedMappool" | undefined {
    if (openAcronyms.some(a => a === identifier.toLowerCase()))
        return "openMappool";
    if (closedAcronyms.some(a => a === identifier.toLowerCase()))
        return "closedMappool";
    return undefined;
}