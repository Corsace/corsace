import { Client, Guild, GuildMember, GatewayIntentBits, Partials } from "discord.js";
import { config } from "node-config-ts";

// Add more later as needed
// TODO: See which intents are required after (most) commands are imported from Maquia
const discordClient = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.Channel,
    ],
});

discordClient.login(config.discord.token).catch(err => {
    if (err) throw err;
});

// Ready instance for the bot
discordClient.once("ready", () => {
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
    } catch (e: any) {
        if (e.code && (e.code === 10007 || e.code === 404))
            member = undefined;
        else
            throw e;
    }
    return member;
}

export { discordClient, discordGuild, getMember };
