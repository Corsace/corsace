import { Interaction } from "discord.js";
import { commands } from "../commands";

export default async function interactionCreate (interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find(c => c.data.name === interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        await command.run(interaction);
    } catch (error) {
        console.log("Yo");
        console.error(error);
        await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
    }
}