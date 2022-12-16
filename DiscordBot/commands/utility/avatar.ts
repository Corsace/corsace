import { ChatInputCommandInteraction, Guild, ImageURLOptions, Message, SlashCommandBuilder, User } from "discord.js";
import { discordClient } from "../../../Server/discord";
import { Command } from "../index";

const avatarOptions: ImageURLOptions = { extension: "png", size: 2048 };

function getAvatar (target: User | Guild, negate: boolean) {
    const ava = target instanceof User ? target.displayAvatarURL(avatarOptions) : target.iconURL(avatarOptions);
    if (negate)
        return `<${ava}>`;
    return ava;
}

async function run (m: Message | ChatInputCommandInteraction) {
    let text = "There is no avatar!";

    if (m instanceof Message) { // Message
        const avatarRegex = /(quote)?(a|ava|avatar)(q|quote)?\s+(.+)/i; // General command
        const serverRegex = /(-s\s|-s$)/i; // For obtaining the server's avatar
        const negateRegex = /-(np|noprev(iew)?)/i; // Remove image preview from message
        
        if (serverRegex.test(m.content)) { // Server icon
            if (!m.guild)
                text = "This is not a server!";
            else if (m.guild.iconURL(avatarOptions))
                text = `Here is the server avatar: ${getAvatar(m.guild, negateRegex.test(m.content))}`;
        } else if (m.mentions.members && m.mentions.members.size > 0) { // Users are mentioned
            text = "";
            m.mentions.users.each((user) => {
                text += `${user.username}'s avatar is: ${getAvatar(user, negateRegex.test(m.content))}\n`;
            });
        } else if (avatarRegex.test(m.content)) { // A username may be written
            const regRes = avatarRegex.exec(m.content);
            const target = regRes && regRes[4] ? regRes[4] : "";
            if (target) {
                try {
                    const user = await discordClient.users.fetch(target);
                    text = `${user.username}'s avatar is ${getAvatar(user, negateRegex.test(m.content))}`;
                } catch (e) {
                    if (m.guild) {
                        const members = await m.guild.members.fetch({ query: target });
                        const member = members.first();
                        if (member)
                            text = `${member.user.username}'s avatar is ${getAvatar(member.user, negateRegex.test(m.content))}`;
                    }
                }
            }
        } else // Give the user their own avatar
            text = `Your avatar is ${getAvatar(m.author, negateRegex.test(m.content))}`;
    } else { // Slash Command
        const subcommand = m.options.getSubcommand();
        if (subcommand === "user") {
            const target = m.options.getUser("target");
            const preview = m.options.getBoolean("preview");
            if (target)
                text = `${target.username}'s avatar is ${getAvatar(target, !preview)}`;
            else
                text = `Your avatar is ${getAvatar(m.user, !preview)}`;
        } else if (subcommand === "server") {
            const preview = m.options.getBoolean("preview");
            if (m.guild)
                text = `Here is the server avatar: ${getAvatar(m.guild, !preview)}`;
        }
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
            .addUserOption(option => option.setName("target").setDescription("The user"))
            .addBooleanOption(option => option.setName("preview").setDescription("Show preview of avatar")))
    .addSubcommand(subcommand =>
        subcommand
            .setName("server")
            .setDescription("Avatar from the server")
            .addBooleanOption(option => option.setName("preview").setDescription("Show preview of avatar")));

const avatar: Command = {
    data,
    category: "utility",
    run,
};

export default avatar;