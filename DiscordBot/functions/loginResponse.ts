import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message } from "discord.js";

export const loginRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setURL("https://corsace.io")
            .setLabel("Login")
            .setStyle(ButtonStyle.Link)
    );

export async function loginResponse (m: Message | ChatInputCommandInteraction) {
    if (m instanceof Message) m.reply({
        content: "No user found in the corsace database for you! Please login to the Corsace website with your discord and osu! accounts!", 
        components: [loginRow],
    });
    else m.editReply({
        content: "No user found in the corsace database for you! Please login to the Corsace website with your discord and osu! accounts!", 
        components: [loginRow],
    });
}