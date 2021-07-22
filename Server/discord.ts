import * as Discord from "discord.js";
import { config } from "node-config-ts";

const discordClient = new Discord.Client;

discordClient.login(config.discord.token).then(() => {
    console.log("Logged into discord!");
}).catch(err => {if (err) throw err;});

discordClient.on("error", err => {
    console.log(err);
});

const discordGuild = (): Promise<Discord.Guild> => discordClient.guilds.fetch(config.discord.guild);

async function getMember (ID: string): Promise<Discord.GuildMember | undefined> {
    let member: Discord.GuildMember | undefined;
    try {
        member = await (await discordGuild()).members.fetch(ID);
    } catch (e) {
        if (e.code === 10007 || e.code === 404)
            member = undefined;
        else
            throw e;
    }
    return member;
}

export { discordClient, discordGuild, getMember };
