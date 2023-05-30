import { ChatInputCommandInteraction, Guild, GuildMember, ImageURLOptions, Message, SlashCommandBuilder, User } from "discord.js";
import { discordClient } from "../../../Server/discord";
import { Command } from "../index";

const avatarOptions: ImageURLOptions = { extension: "png", size: 2048 };

async function getAvatar (target: User | Guild | GuildMember, negate: boolean, guildSpecific?: boolean): Promise<string> {
    let ava: string | null;

    if (target instanceof Guild) {
        ava = target.iconURL(avatarOptions);
    } else if (target instanceof GuildMember) {
        ava = !guildSpecific ? target.user.displayAvatarURL(avatarOptions) : target.displayAvatarURL(avatarOptions);
    } else {
        ava = target.displayAvatarURL(avatarOptions);
    }

    return negate ? `<${ava}>` : ava || "";
}

function getAvatarText (username: string, avatar: string): string {
    return `${username}'s avatar is: ${avatar}\n`;
}

async function getAvatarForUser (user: User | GuildMember, negate: boolean, guildSpecific?: boolean): Promise<string> {
    const avatar = await getAvatar(user, negate, guildSpecific);
    const username = user instanceof GuildMember ? user.user.username : user.username;
    return getAvatarText(username, avatar);
}

async function getAvatarForServer (m: Message | ChatInputCommandInteraction, negate: boolean): Promise<string> {
    if (!m.guild) return "This isn't a server";
    const avatar = await getAvatar(m.guild, negate);
    return `Here's the server avatar: ${avatar}`;
}

async function handleAvatarCommand (m: Message): Promise<string> {
    const avatarRegex = /(quote)?(a|ava|avatar)(q|quote)?\s+(.+)/i;
    const serverRegex = /(-s\s|-s$)/i;
    const negateRegex = /-(np|noprev(iew)?)/i;
    const nonServerSpecificRegex = /(-ns\s|-ns$)/i;
    const serverAvatar = serverRegex.test(m.content);
    const negate = negateRegex.test(m.content);
    const guildSpecific = !nonServerSpecificRegex.test(m.content);

    // Replace all flags with empty string and trim
    m.content = m.content.replace(serverRegex, "").replace(negateRegex, "").replace(nonServerSpecificRegex, "").trim();

    if (serverAvatar) {
        return await getAvatarForServer(m, negate);
    }

    if (m.mentions.members && m.mentions.members.size > 0) {
        let text = "";
        for (const user of m.mentions.users.values()) {
            text += await getAvatarForUser(user, negate, guildSpecific);
        }
        return text;
    }

    if (avatarRegex.test(m.content)) {
        const regRes = avatarRegex.exec(m.content);
        const target = regRes && regRes[4] ? regRes[4] : "";
        if (!target) return "No target found";
        try {
            const user = await discordClient.users.fetch(target);
            return await getAvatarForUser(user, negate, guildSpecific);
        } catch (err) {
            return "Couldn't find that user";
        }
    }

    if (m.guild && m.guild.members.cache.has(m.author.id)) {
        const guildMember = m.guild.members.cache.get(m.author.id);
        if (!guildMember)
            return await getAvatarForUser(m.author, negate);
        
        return await getAvatarForUser(guildMember, negate, guildSpecific);
    }
    
    return await getAvatarForUser(m.author, negate, guildSpecific);
}

async function handleSlashCommand (m: ChatInputCommandInteraction): Promise<string> {
    const preview = m.options.getBoolean("preview");
    const subcommand = m.options.getSubcommand();
    const guildSpecific = m.options.getBoolean("server_specific") !== null ? m.options.getBoolean("server_specific")! : true;
    const negate = !preview;

    if (subcommand === "user") {
        const target = m.options.getUser("target");
        if (target) {
            return await getAvatarForUser(target, negate, guildSpecific);
        }
        return await getAvatarForUser(m.user, negate);
    } else if (subcommand === "server" && m.guild) {
        return await getAvatarForServer(m, negate);
    }

    return "Invalid subcommand";
}

async function run (m: Message | ChatInputCommandInteraction) {
    let text = "";

    if (m instanceof Message) {
        text = await handleAvatarCommand(m);
    } else {
        text = await handleSlashCommand(m);
    }

    m.reply(text);
}

const data = new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Obtains the avatar for a user/server.")
    .addSubcommand(subcommand =>
        subcommand
            .setName("user")
            .setDescription("Avatar from a user")
            .addUserOption(option => 
                option.setName("target")
                    .setDescription("The user"))
            .addBooleanOption(option => 
                option.setName("preview")
                    .setDescription("Show preview of avatar (Default: true)"))
            .addBooleanOption(option => 
                option.setName("server_specific")
                    .setDescription("Show your server-specific avatar if used in server (Default: true)")))
    .addSubcommand(subcommand =>
        subcommand
            .setName("server")
            .setDescription("Avatar from the server")
            .addBooleanOption(option => 
                option.setName("preview")
                    .setDescription("Show preview of avatar (Default: true)")));

const avatar: Command = {
    data,
    alternativeNames: ["ava", "a"],
    category: "utility",
    run,
};

export default avatar;