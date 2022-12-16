import { REST, Routes } from "discord.js";
import { config } from "node-config-ts";
import { createConnection } from "typeorm";
import { discordClient } from "../Server/discord";
import guildMemberAdd from "./handlers/guildMemberAdd";
import interactionCreate from "./handlers/interactionCreate";
import guildMemberRemove from "./handlers/guildMemberRemove";
import messageCreate from "./handlers/messageCreate";
import ormConnectionOptions from "../ormconfig";
import mappoolFunctions from "./functions/mappoolFunctions";
import { commands } from "./commands";

// Discord bot event handlers
discordClient.on("guildMemberAdd", guildMemberAdd);
discordClient.on("guildMemberRemove", guildMemberRemove);
discordClient.on("messageCreate", messageCreate);
discordClient.on("interactionCreate", interactionCreate);

// Discord command registrations
const rest = new REST({ version: "10" }).setToken(config.discord.token);
(async () => {
    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(
            Routes.applicationCommands(config.discord.clientId),
            { body: commands.map(c => c.data) }
        );

        console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

// Setup timer for sheet query
const initialRun = new Date();
const targetRun = new Date();
if (initialRun.getUTCHours() > 12)
    targetRun.setUTCDate(initialRun.getDate() + 1);
else
    targetRun.setUTCHours(12);

// Ready instance for the bot
discordClient.once("ready", () => {
    setTimeout(mappoolFunctions.sheetTimer, targetRun.getTime() - Date.now());
});

// Start the bot
createConnection(ormConnectionOptions)
    .then((connection) => {
        console.log(`Connected to the ${connection.options.database} (${connection.options.name}) database!`);
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));