// This script will notify of any properties within the en.json file that are similar based on the levenstein distance.
// For any similar properties, take note of them, and update/remove them as needed.
import * as langData from "../../Assets/lang/en.json";
import { distance } from "fastest-levenshtein";

const LEVENSHTEIN_DISTANCE_THRESHOLD = 2;

interface LangData {
    [key: string]: string | LangData;
}

// Define a function to flatten a nested object
function flattenObject (obj: LangData, prefix = ""): Record<string, string> {
    // Use the reduce function to iterate over each key-value pair in the object
    return Object.keys(obj).reduce((acc: Record<string, string>, k: string) => {
        if (k === "default") return acc;

        // Define a prefix for nested keys. If a prefix already exists, append a dot to it.
        const pre = prefix.length ? prefix + "." : "";
  
        // If the value associated with the current key is an object itself, call the flattenObject function recursively
        if (typeof obj[k] === "object" && obj[k] !== null) 
            Object.assign(acc, flattenObject(obj[k] as LangData, pre + k));
  
        // If the value is not an object, simply add the key-value pair to the accumulator object
        else 
            acc[pre + k] = obj[k] as string;
  
        // Return the accumulator object, which collects all key-value pairs
        return acc;
  
    // The second argument to reduce initializes the accumulator as an empty object
    }, {});
}
  
const flatLangData = flattenObject(langData);
  
// Group strings by length
const lenMap: { [key: number]: {key: string, val: string}[] } = {};
for (const [k, v] of Object.entries(flatLangData)) {
    const len = v.length;
    if (!lenMap[len]) lenMap[len] = [];
    lenMap[len].push({key: k, val: v});
}
  
// Check each group for similar strings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
for (const [_, entries] of Object.entries(lenMap)) {
    for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
            const dist = distance(entries[i].val, entries[j].val);
            if (dist <= LEVENSHTEIN_DISTANCE_THRESHOLD) {
                console.log(`${entries[i].key} (${entries[i].val}) <-> ${entries[j].key} (${entries[j].val})`);
            }
        }
    }
}