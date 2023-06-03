import { Message, EmbedBuilder, ChatInputCommandInteraction, SlashCommandBuilder, APIApplicationCommandOption, GuildMember } from "discord.js";
import { Command, commands } from "..";

function optionParser (options: APIApplicationCommandOption[] | undefined): string {
    if (!options) return "";

    const commandOptions: string[] = [];
    let subcommandOptions: string[] = [];
    
    options.forEach(option => {
        if (option.type === 1 && option.options) {
            // This is a subcommand. Process its options as a single unit.
            const subOptions = option.options.map(subOption => {
                if (subOption.required) {
                    return `<${subOption.name}>`;
                } else {
                    return `[${subOption.name}]`;
                }
            });
            subcommandOptions.push(subOptions.join(" "));
        } else {
            // This is an option of the command itself.
            if (option.required) {
                commandOptions.push(`<${option.name}>`);
            } else {
                commandOptions.push(`[${option.name}]`);
            }
        }
    });

    // Change each string into an array of strings split by spaces
    const subCommandOptionsArray = subcommandOptions.map(subcommandOption => subcommandOption.split(" "));

    // See if any of the subcommand options are shared by all subcommands
    const sharedOptions: string[] = [];
    subCommandOptionsArray.forEach(subCommandOptionArray => {
        if (sharedOptions.length === 0)
            sharedOptions.push(...subCommandOptionArray);
        else {
            const sharedOptionsCopy = [...sharedOptions];  // Create a copy of sharedOptions
            sharedOptionsCopy.forEach(sharedOption => {
                if (!subCommandOptionArray.includes(sharedOption))
                    sharedOptions.splice(sharedOptions.indexOf(sharedOption), 1);
            });
        }
    });

    // Remove the shared options from the subcommand options, and add them to the command options
    sharedOptions.forEach(sharedOption => {
        subCommandOptionsArray.forEach(subCommandOptionArray => {
            if (subCommandOptionArray.includes(sharedOption))
                subCommandOptionArray.splice(subCommandOptionArray.indexOf(sharedOption), 1);
        });
        commandOptions.push(sharedOption);
    });

    // Combine the subcommand options back into strings, and remove any empty strings
    subcommandOptions = subCommandOptionsArray.map(subCommandOptionArray => subCommandOptionArray.join(" ")).filter(subCommandOption => subCommandOption.length > 0);

    // Combine command options and subcommand options. If there's only one substring, use square brackets instead of parentheses
    return commandOptions.join(" ") + (subcommandOptions.length > 1 ? ` (${subcommandOptions.join(" | ")})` : subcommandOptions.length === 1 ? ` [${subcommandOptions[0]}]` : "");
}

async function run (m: Message | ChatInputCommandInteraction) {
    const helpRegex = /help\s+(.+)/i; // General command
    const embed = new EmbedBuilder({
        author: {
            //name: "Click here to invite Corsace!", <-- Add later when bot is public
            //url: `https://discordapp.com/oauth2/authorize?&client_id=${config.discord.clientId}&scope=bot&permissions=0`
            name: "corsace",
            iconURL: (m.member as GuildMember | null)?.displayAvatarURL() || undefined,
        },
        description: "**Most commands have other forms as well for convenience!**\n\n**Do `!help <command>` for more information about the command!**\nHelp information format: `(cmd|names) <args> [optional args]`",
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
        embed.setDescription(`\`!${command!.data.name} ${command!.data.toJSON().options ? optionParser(command!.data.toJSON().options) : ""}\`\n${command!.data.description}\n\n**Aliases:** ${command!.alternativeNames.map(a => `\`${a}\``).join(", ")}`);
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