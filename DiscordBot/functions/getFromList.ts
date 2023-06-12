import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message, MessageComponentInteraction } from "discord.js";
import { stopRow, timedOut } from "./messageInteractionFunctions";
import { randomUUID } from "crypto";
import commandUser from "./commandUser";
import respond from "./respond";

export default async function getFromList<T extends { ID: number, name: string }> (m: Message | ChatInputCommandInteraction, list: T[], listName: string, query: string): Promise<T | undefined> {
    if (list.length === 0) {
        await respond(m, `No ${listName} found`);
        return;
    }

    if (list.length === 1)
        return list[0];

    const [stopID, stop] = stopRow();
    const ids = {
        stop: stopID,
    };
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    let row = new ActionRowBuilder<ButtonBuilder>();
    for (const item of list) {
        ids[item.ID] = randomUUID();
        row = row.addComponents(
            new ButtonBuilder()
                .setCustomId(ids[item.ID])
                .setLabel(item.name)
                .setStyle(ButtonStyle.Primary)
        );
        if (row.components.length === 5) {
            rows.push(row);
            row = new ActionRowBuilder<ButtonBuilder>();
        }
        if (rows.length === 4)
            break;
    }
    if (row.components.length > 0)
        rows.push(row);

    const message = await m.channel!.send({
        content: `Multiple ${listName}s match the query \`${query}\`\nWhich ${listName} are we working on?${rows.length === 4 ? " If u don't see it, refine ur tiny search query or something because there's proly too many results" : ""}`,
        components: [...rows, stop],
    });

    let stopped = false;
    const filter = (i: MessageComponentInteraction) => i.user.id === commandUser(m).id;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    return new Promise((resolve) => {	
        componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
            if (i.customId === ids.stop) {	
                stopped = true;	
                componentCollector.stop();	
                await i.reply(`${listName} selection stopped`);	
                setTimeout(async () => (await i.deleteReply()), 5000);	
                return;	
            }	
            const item = list.find(t => ids[t.ID] === i.customId);	
            if (!item) {	
                await i.reply(`That ${listName} doesn't exist`);	
                setTimeout(async () => (await i.deleteReply()), 5000);	
                return;	
            }	
            stopped = true;	
            componentCollector.stop();	
            resolve(item);	
        });	
        componentCollector.on("end", () => timedOut(message, stopped, `${listName} selection`));	
    });
}