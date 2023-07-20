import { randomUUID } from "crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message, MessageComponentInteraction } from "discord.js";
import commandUser from "./commandUser";

export default async function confirmCommand (m: Message | ChatInputCommandInteraction, content: string, useFilter = true, targetFilter = commandUser(m).id): Promise<boolean> {
    const ids = {
        yes: randomUUID(),
        no: randomUUID(),
    };
    const message = await m.channel!.send({
        content,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(ids.yes)
                        .setLabel("Yes")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(ids.no)
                        .setLabel("No")
                        .setStyle(ButtonStyle.Danger)),
        ],
    });

    return new Promise<boolean>(resolve => {
        const filter = (i: MessageComponentInteraction) => i.user.id === targetFilter;
        const confirmationCollector = m.channel!.createMessageComponentCollector({ filter: useFilter ? filter : undefined, time: 6000000 });
        confirmationCollector.on("collect", async (i: MessageComponentInteraction) => {
            if (i.customId === ids.yes) {
                await message.delete();
                confirmationCollector.stop();
                resolve(true);
            }
            else if (i.customId === ids.no) {
                await message.delete();
                confirmationCollector.stop();
                resolve(false);
            }
        });
    });
}