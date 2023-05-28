import { randomUUID } from "crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, MessageComponentInteraction, PermissionFlagsBits, PermissionsBitField } from "discord.js";

// Filter to use for message and interaction collectors
export const filter = (msg: Message | MessageComponentInteraction) => {
    const notBot = !(msg instanceof MessageComponentInteraction ? msg.user.bot : msg.author.bot);
    const admin = (msg.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator);
    return notBot && admin;
};

// Basic button row with a single stop button
export function stopRow (): [string, ActionRowBuilder<ButtonBuilder>]  {
    const id = randomUUID();
    const stopRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(id)
                .setLabel("STOP COMMAND")
                .setStyle(ButtonStyle.Danger)
        );
    return [id, stopRow];
}

export async function timedOut (m: Message, stopped: boolean, item: string) {
    await m.delete();
    if (!stopped)
        await m.reply(`${item} timed out.`);
}