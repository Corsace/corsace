import * as Discord from "discord.js";
import { Config } from "../config";

const config = new Config();

const discordClient = new Discord.Client;

discordClient.login(config.discord.token).then(() => {
    console.log("Logged into discord!");
}).catch(err => {if (err) throw err;});

discordClient.on("error", err => {
    console.log(err);
});

const discordGuild = (): Promise<Discord.Guild> => discordClient.guilds.fetch(config.discord.guild);

export { discordClient, discordGuild };