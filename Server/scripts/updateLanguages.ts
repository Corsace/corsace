// This script is to automatically update the language JSON files with the latest list of keys whenever en.json is updated
// Run this whenever a commit/pull request is being made that requires changes in en.json
import * as fs from "fs";
import * as langData from "../../Assets/lang/en.json";

const dir = "../../Assets/lang/";

fs.readdir(__dirname + "/" + dir, (err, f) => {
    if (err) throw err;
    for (const filename of f) {
        if (filename === "flagCodes.json" || filename === "en.json")
            continue;
        
        const initialKeys = Object.keys(langData).filter(key => key !== "default");

        fs.readFile(__dirname + "/" + dir + filename, (err, data) => {
            if (err) throw err;
            // get JSON data of target JSON
            const str = data.toString();
            const jsonData = JSON.parse(str);

            // Delete obsolete keys
            const targetKeys = Object.keys(jsonData);
            for (const key of targetKeys)
                jsonData[key] = delChecker(jsonData, key, langData);
            
            // Add new keys
            for (const key of initialKeys)
                jsonData[key] = checker(langData, key, jsonData);

            fs.writeFile(__dirname + "/" + dir + filename, JSON.stringify(jsonData, null, 4), (err) => {
                if (err) throw err;
            });
        });
    }
});

function checker (original, key, target) {
    // if its a string value and target deosnt have it add an empty string val
    if (typeof original[key] === "string" && !target[key])
        return "";

    // if its an object value
    if (typeof original[key] !== "string") {
        
        // initiate empty object if it doesn't exist so that the recursiveness doesn't accidentally try to key something undefined
        if (!target[key])
            target[key] = {}; 

        // Recursive time
        const newKeys = Object.keys(original[key]);
        for (const newKey of newKeys) {
            target[key][newKey] = checker(original[key], newKey, target[key]);
        }
    }
    return target[key];
}

function delChecker (target, key, original) {
    // If the original doens't have any value for this key then just return undefined
    if (!original[key]) return undefined;

    // No change needed
    if (typeof target[key] === "string" && typeof original[key] === "string") return target[key]; 

    // If original is a string but target isnt
    if (typeof original[key] === "string") return "";

    // original is an object for sure now just return an empty object checker will add the stuff anyway
    if (typeof target[key] === "string") return {};
    
    // deep dive to weed out any obsolete nested keys
    const targetKeys = Object.keys(target[key]);
    for (const targetKey of targetKeys)
        target[key][targetKey] = delChecker(target[key], targetKey, original[key]);
    return target[key];
}