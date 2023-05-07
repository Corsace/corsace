import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, MessageComponentInteraction, PermissionFlagsBits, PermissionsBitField } from "discord.js";

// Filter to use for message and interaction collectors
export const filter = (msg: Message | MessageComponentInteraction) => {
    const notBot = !(msg instanceof MessageComponentInteraction ? msg.user.bot : msg.author.bot);
    const admin = (msg.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator);
    return notBot && admin;
};

// Basic button row with a single stop button
export const stopRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setCustomId("stop")
            .setLabel("STOP COMMAND")
            .setStyle(ButtonStyle.Danger)
    );