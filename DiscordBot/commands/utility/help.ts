import { Message, MessageEmbed } from "discord.js";
import { config } from "node-config-ts";
import { Command, commands } from "..";
import { discordClient } from "../../../Server/discord";

async function command (m: Message) {
    const helpRegex = /help\s+(.+)/i; // General command
    const embed = new MessageEmbed({
        author: {
            //name: "Click here to invite Corsace!", <-- Add later when bot is public
            //url: `https://discordapp.com/oauth2/authorize?&client_id=${config.discord.clientId}&scope=bot&permissions=0`
            name: "corsace",
            iconURL: discordClient.user?.avatarURL({format: "png", size: 2048, dynamic: true}) as string,
        },
        description: "**Most commands have other forms as well for convenience!**\n\n**Please do `!help <command>` for more information about the command!**\nHelp information format: `(cmd|names) <args> [optional args]`",
        color: 0xFB2475,
        fields: [{
            name: "categories:",
            value: commands.filter((v, i, s) => s.findIndex(c => c.category === v.category) === i).map(c => `\`${c.category}\``).join("\n"),
        }],
    });

    if (helpRegex.test(m.content)) {
        const arg = helpRegex.exec(m.content)![1];
        if (commands.filter((v, i, s) => s.findIndex(c => c.category === v.category) === i).map(c => c.category).some(category => category.toLowerCase() === arg.toLowerCase())) {
            const category = commands.filter((v, i, s) => s.findIndex(c => c.category === v.category) === i).map(c => c.category).find(category => category.toLowerCase() === arg.toLowerCase());
            embed.fields = [{
                name: `${category} commands:`,
                value: commands.filter(cmd => cmd.category === category).map(cmd => `\`${cmd.name[0]}\`,`).join(" "),
                inline: true,
            }];
        } else if (commands.some(cmd => cmd.name.some(name => name === arg.toLowerCase()))) {
            const command = commands.find(cmd => cmd.name.some(name => name === arg.toLowerCase()));
            embed.author!.name = `Command: ${command!.name.join(" / ")}`,
            embed.description = `\`${command!.usage}\` ${command!.description}`;
            embed.fields = [];
        }
    }

    await m.channel.send(embed);
}

const help: Command = {
    name: ["help"],
    description: "Provides explanation for any command given",
    usage: "!help <command | category>",
    category: "utility",
    command,
};

export default help;