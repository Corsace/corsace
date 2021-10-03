import { ImageURLOptions, Message, User } from "discord.js";
import { discordClient } from "../../../Server/discord";
import { Command } from "../index";

const avatarOptions: ImageURLOptions & { dynamic?: boolean } = { format: "png", size: 2048, dynamic: true };

function getAvatar (user: User) {
    return user.displayAvatarURL(avatarOptions) ?? `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png?size=2048`;
}

async function command (m: Message) {
    const avatarRegex = /(quote)?(a|ava|avatar)(q|quote)?\s+(.+)/i; // General command
    const serverRegex = /(-s\s|-s$)/i; // For obtaining the server's avatar
    const negateRegex = /-(np|noprev(iew)?)/i; // Remove image preview from message

    // Get server avatar
    if (serverRegex.test(m.content)) {
        if (!m.guild) {
            m.channel.send("This is not a server!");
            return;
        }
        const ava = m.guild.iconURL(avatarOptions);
        m.channel.send(`Here is the server avatar: ${ava}`);
        return;
    }
    
    // Get avatar for people mentioned
    if (m.mentions.members && m.mentions.members.size > 0) {
        const mentions = m.mentions;

        const avas = {};
        mentions.users.each((user) => {
            avas[user.username] = getAvatar(user);
        });

        let messageBuilder = "";
        for (const user of Object.keys(avas)) {
            if (negateRegex.test(m.content))
                messageBuilder += `${user}'s avatar is: <${avas[user]}>\n`;
            else
                messageBuilder += `${user}'s avatar is: ${avas[user]}\n`;
        }
        m.channel.send(messageBuilder);
        return;
    } 
    
    // Get avatar for the user themself or someone else
    const regRes = avatarRegex.exec(m.content);

    // Themself
    if (!regRes || !regRes[4]) { 
        if (negateRegex.test(m.content))
            m.channel.send(`Your avatar is <${getAvatar(m.author)}>`);
        else
            m.channel.send(`Your avatar is ${getAvatar(m.author)}`);
        return;
    }

    // Someone else
    const target = regRes[4];
    let user: User;
    try {
        user = await discordClient.users.fetch(target);
    } catch (e) {
        if (!m.guild) { // Just return their own avatar if they are spamming stuff after the command in a DM or something
            if (negateRegex.test(m.content))
                m.channel.send(`Your avatar is <${getAvatar(m.author)}>`);
            else
                m.channel.send(`Your avatar is ${getAvatar(m.author)}`);
            return;
        }

        const members = await m.guild.members.fetch({ query: target });
        const member = members.first();
        if (!member) {
            if (negateRegex.test(m.content))
                m.channel.send(`Could not find the user ${target}, here is your avatar: <${getAvatar(m.author)}>`);
            else
                m.channel.send(`Could not find the user ${target}, here is your avatar: ${getAvatar(m.author)}`);
            return; 
        }
        user = member.user;
    }

    if (negateRegex.test(m.content))
        m.channel.send(`${user.username}'s avatar is <${getAvatar(user)}>`);
    else
        m.channel.send(`${user.username}'s avatar is ${getAvatar(user)}`);
}

const avatar: Command = {
    name: ["a", "ava", "avatar", "qa", "qava", "qavatar", "aq", "avaq", "avatarq", "quotea", "quoteava", "quoteavatar", "aquote", "avaquote", "avatarquote"],
    description: "Obtains the avatar for a user/server.",
    usage: "!(a|ava|avatar)",
    category: "utility",
    command,
};

export default avatar;