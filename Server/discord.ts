import * as Discord from "discord.js";
import {config} from "node-config-ts";

let loggedIn = false;
const _discordClient = new Discord.Client;
const discordClient = (): Discord.Client => {
    if (!loggedIn) {
        loggedIn = true;
        _discordClient.login(config.discord.token).then(() => {
            console.log("Logged into discord!");
        }).catch(err => {
            if (err) {
                loggedIn = false;
                throw err;
            }
        });
    }
    return _discordClient;
};

_discordClient.on("error", err => {
    console.log(err);
});

const discordGuild = (): Promise<Discord.Guild> => discordClient().guilds.fetch(config.discord.guild);

export {discordClient, discordGuild};
