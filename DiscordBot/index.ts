import { REST, Routes } from "discord.js";
import { config } from "node-config-ts";
import { discordClient } from "../Server/discord";
import guildMemberAdd from "./handlers/guildMemberAdd";
import interactionCreate from "./handlers/interactionCreate";
import guildMemberRemove from "./handlers/guildMemberRemove";
import messageCreate from "./handlers/messageCreate";
import ormConfig from "../ormconfig";
import { commands } from "./commands";
import { OAuth, User } from "../Models/user";

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

        console.log(`Successfully reloaded ${commands.length} slash (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

// Ready instance for the bot
discordClient.once("ready", () => {
    console.log(`Logged in as ${discordClient.user?.tag}!`);
});

// Start the bot
ormConfig.initialize()
    .then((connection) => {
        console.log(`Connected to the ${connection.options.database} (${connection.options.name}) database!`);
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));