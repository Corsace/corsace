import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message } from "discord.js";
import respond from "./respond";

const loginRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setURL("https://corsace.io")
            .setLabel("Login")
            .setStyle(ButtonStyle.Link)
    );

export async function loginResponse (m: Message | ChatInputCommandInteraction, text = "Login to the Corsace website with ur discord and osu! accounts") {
    await respond(m, text, undefined, [loginRow]);
}