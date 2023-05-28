import { Message, EmbedBuilder, ChatInputCommandInteraction, SlashCommandBuilder, ToAPIApplicationCommandOptions } from "discord.js";
import { Command, commands } from "..";
import { discordClient } from "../../../Server/discord";

function optionParser (options: ToAPIApplicationCommandOptions[]) {
    return options.map(option => {
        const o = option.toJSON();
        if (o.type === 1)
            return `(${o.name}|${o.options?.map(o => o.name).join("|")})`;
        else if (o.required)
            return `<${o.name}>`;
        else
            return `[${o.name}]`;
    }).join(" ");
}

async function run (m: Message | ChatInputCommandInteraction) {
    const helpRegex = /help\s+(.+)/i; // General command
    const embed = new EmbedBuilder({
        author: {
            //name: "Click here to invite Corsace!", <-- Add later when bot is public
            //url: `https://discordapp.com/oauth2/authorize?&client_id=${config.discord.clientId}&scope=bot&permissions=0`
            name: "corsace",
            iconURL: discordClient.user?.avatarURL({extension: "png", size: 2048}) as string,
        },
        description: "**Most commands have other forms as well for convenience!**\n\n**Please do `!help <command>` for more information about the command!**\nHelp information format: `(cmd|names) <args> [optional args]`",
        color: 0xFB2475,
        fields: [{
            name: "categories:",
            value: commands.filter((v, i, s) => s.findIndex(c => c.category === v.category) === i).map(c => `\`${c.category}\``).join("\n"),
        }],
    });

    const arg = m instanceof Message ? helpRegex.exec(m.content)?.[1] : m.options.getString("command", false);
    if (!arg) {
        await m.reply({ embeds: [embed] });
        return;
    }

    if (commands.filter((v, i, s) => s.findIndex(c => c.category === v.category) === i).map(c => c.category).some(category => category.toLowerCase() === arg.toLowerCase())) {
        const category = commands.filter((v, i, s) => s.findIndex(c => c.category === v.category) === i).map(c => c.category).find(category => category.toLowerCase() === arg.toLowerCase());
        embed.addFields({
            name: `${category} commands:`,
            value: commands.filter(cmd => cmd.category === category).map(cmd => `\`${cmd.data.name}\`,`).join(" "),
            inline: true,
        });
    } else if (commands.some(cmd => cmd.data.name.toLowerCase() === arg.toLowerCase() || cmd.alternativeNames.some(a => a.toLowerCase() === arg.toLowerCase()))) {
        const command = commands.find(cmd => cmd.data.name.toLowerCase() === arg.toLowerCase() || cmd.alternativeNames.some(a => a.toLowerCase() === arg.toLowerCase()));
        embed.setAuthor({name: `Command: ${command!.data.name}`});
        embed.setDescription(`\`!${command!.data.name} ${optionParser(command!.data.options)}\`\n${command!.data.description}\n\n**Aliases:** ${command!.alternativeNames.map(a => `\`${a}\``).join(", ")}`);
        embed.addFields(command!.data.options.map(option => {
            const o = option.toJSON();
            return {
                name: o.name,
                value: o.description,
                inline: true,
            };
        }));
    }

    await m.reply({ embeds: [embed] });
}

const data = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Provides explanation for any command given")
    .addStringOption(option => 
        option.setName("command")
            .setDescription("Command to get help for")
    );

const help: Command = {
    data,
    alternativeNames: ["h"],
    category: "utility",
    run,
};

export default help;