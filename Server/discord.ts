import { Client, Guild, GuildMember } from "discord.js";
import { config } from "node-config-ts";

const discordClient = new Client;

discordClient.login(config.discord.token).catch(err => {
    if (err) throw err;
});

discordClient.on("ready", () => {
    console.log(`Logged into discord as ${discordClient.user?.tag}`);
});

discordClient.on("error", err => {
    console.error(err);
});

const discordGuild = (): Promise<Guild> => discordClient.guilds.fetch(config.discord.guild);

async function getMember (ID: string): Promise<GuildMember | undefined> {
    let member: GuildMember | undefined;
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
