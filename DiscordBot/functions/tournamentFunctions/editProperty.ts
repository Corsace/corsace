import { randomUUID } from "crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, MessageComponentInteraction } from "discord.js";
import commandUser from "../commandUser";

export default async function editProperty (m: Message, property: string, entity: string, original: string, userID: string) {
    const ids = {
        stop: randomUUID(),
        good: randomUUID(),
    };
    const message = await m.reply({
        content: `U wanna change \`${property}\` of ${entity} from ${original}? Type out the new ${property} if so, otherwise click the buttons below`,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(ids.stop)
                        .setLabel("STOP COMMAND")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(ids.good)
                        .setLabel("It's fine currently")
                        .setStyle(ButtonStyle.Primary)),
                    
        ],
    });
    return new Promise<boolean | string>((resolve) => {
        const filter = (msg: Message | MessageComponentInteraction) => commandUser(msg).id ===  userID;
        const confirmationCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
        const idCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });
        confirmationCollector.on("collect", async (i: MessageComponentInteraction) => {
            if (i.customId === ids.stop) {
                await i.reply("Stopped command");
                setTimeout(async () => await i.deleteReply(), 5000);
                resolve(false);
                confirmationCollector.stop();
                idCollector.stop();
            } else if (i.customId === ids.good) {
                await i.reply("K");
                setTimeout(async () => await i.deleteReply(), 5000);
                resolve(true);
                confirmationCollector.stop();
                idCollector.stop();
            }
        });

        idCollector.on("collect", async (msg: Message) => {
            resolve(msg.content);
            confirmationCollector.stop();
            idCollector.stop();
        });
        idCollector.on("end", async () => {
            await message.delete();
        });
    });
}