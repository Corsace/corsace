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

// REMOVE WHEN READY FOR PR
const users = [
    { country: "CA", osu: { username: "VINXIS", userID: "4323406" }, discord: { username: "pink blood", userID: "352605625869402123" } },
    { country: "NL", osu: { username: "cavoeboy", userID: "7361815" }, discord: { username: "cavoe", userID: "128203919296823296" } },
    { country: "US", osu: { username: "Halfslashed", userID: "4598899" }, discord: { username: "Halfslashed", userID: "109870391559720960" } },
    { country: "CA", osu: { username: "kaetwo", userID: "1997719" }, discord: { username: "kaetwo", userID: "121440769331560459" } },
    { country: "US", osu: { username: "[K]", userID: "16551387" }, discord: { username: "Kay✨", userID: "192493502494408705" } },
    { country: "US", osu: { username: "captin1", userID: "689997" }, discord: { username: "captin", userID: "92487132043546624" } },
    { country: "US", osu: { username: "Aeril", userID: "4334976" }, discord: { username: "Aeril", userID: "130522448448716800" } },
]

// Ready instance for the bot
discordClient.once("ready", () => {
    console.log(`Logged in as ${discordClient.user?.tag}!`);

    for (const user of users) {
        User.findOne({ where: { osu: { userID: user.osu.userID } } })
            .then(async (u) => {
                if (u) {
                    u.discord = user.discord as OAuth;
                    await u.save();
                } else {
                    const newUser = new User();
                    newUser.country = user.country;
                    newUser.osu = user.osu as OAuth;
                    newUser.discord = user.discord as OAuth;
                    await newUser.save();
                }
                console.log(`Saved ${user.discord.username} to database.`);
            });
    }
});

// Start the bot
ormConfig.initialize()
    .then((connection) => {
        console.log(`Connected to the ${connection.options.database} (${connection.options.name}) database!`);
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));