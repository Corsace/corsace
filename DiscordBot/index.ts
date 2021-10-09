import { createConnection } from "typeorm";
import { discordClient } from "../Server/discord";
import guildMemberAdd from "./handlers/guildMemberAdd";
import guildMemberRemove from "./handlers/guildMemberRemove";
import messageCreate from "./handlers/messageCreate";
import ormConnectionOptions from "../ormconfig";
import mappoolFunctions from "./functions/mappoolFunctions";

// Discord event handlers
discordClient.on("guildMemberAdd", guildMemberAdd);
discordClient.on("guildMemberRemove", guildMemberRemove);
discordClient.on("message", messageCreate);

// Setup timer for sheet query
const initialRun = new Date();
const targetRun = new Date();
if (initialRun.getUTCHours() > 12)
    targetRun.setUTCDate(initialRun.getDate() + 1);
else
    targetRun.setUTCHours(12);

discordClient.once("ready", () => setTimeout(mappoolFunctions.sheetTimer, targetRun.getTime() - Date.now()));

createConnection(ormConnectionOptions)
    .then((connection) => {
        console.log(`Connected to the ${connection.options.database} (${connection.options.name}) database!`);
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));