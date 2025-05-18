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
    console.log(`Logged into discord as ${discordClient.user?.username}`);
});

discordClient.on("error", err => {
    console.error(err);
});

const discordGuild = (guildID?: string): Promise<Guild> => discordClient.guilds.fetch(guildID ?? config.discord.guild);

async function getMember (ID: string, guildID?: string): Promise<GuildMember | undefined> {
    let member: GuildMember | undefined;
    try {
        member = await (await discordGuild(guildID)).members.fetch(ID);
    } catch (e: any) {
        if (e.code && (e.code === 10007 || e.code === 404))
            member = undefined;
        else
            throw e;
    }
    return member;
}

// All members only need to be fetched once per guild, they are then cached indefinitely
const cachedAllMembersGuilds = new Set<string>();
async function fetchAllMembers (guildID: string): Promise<void> {
    if (cachedAllMembersGuilds.has(guildID))
        return;
    await (await discordClient.guilds.fetch(guildID))?.members.fetch();
    cachedAllMembersGuilds.add(guildID);
}

export { discordClient, discordGuild, getMember, fetchAllMembers };
