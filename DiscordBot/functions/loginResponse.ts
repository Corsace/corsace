import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message } from "discord.js";

export default async function loginResponse (m: Message | ChatInputCommandInteraction) {
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setURL("https://corsace.io")
                .setLabel("Login")
                .setStyle(ButtonStyle.Link)
        );
    return m.reply({
        content: "No user found in the corsace database for you! Please login to the Corsace website with your discord and osu! accounts!", 
        components: [row],
    });
}