import { APIActionRowComponent, APIEmbed, APIMessageActionRowComponent, ActionRowBuilder, AttachmentPayload, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, JSONEncodable, Message } from "discord.js";
import { EmbedBuilder } from "./embedBuilder";
import commandUser from "./commandUser";

export default async function respond (m: Message | ChatInputCommandInteraction, content?: string, embeds?: EmbedBuilder | (APIEmbed | JSONEncodable<APIEmbed>)[], components?: JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>[], files?: AttachmentPayload[]) {
    let pages: APIEmbed[] = [];
    let currPage = 0;
    if (embeds instanceof EmbedBuilder) {
        pages = embeds.build();
        embeds = [pages[currPage]];
    }

    let message: Message;
    if (m instanceof Message)
        message = await m.reply({ content, embeds, components, files });
    else if (m.replied || m.deferred)
        message = await m.editReply({ content, embeds, components, files });
    else {
        await m.reply({ content, embeds, components, files });
        message = await m.fetchReply();
    }

    if (pages.length > 1) {
        const paginationButtons = () => {
            return new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("pagination:previous")
                    .setLabel("Previous")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currPage === 0),
                new ButtonBuilder()
                    .setCustomId("pagination:next")
                    .setLabel("Next")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currPage === pages.length - 1)
            );
        };

        if (!components)
            components = [paginationButtons()];
        else
            components.push(paginationButtons());

        await message.edit({ content, embeds: [pages[currPage]], components, files });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: i => i.user.id === commandUser(m).id && (i.customId === "pagination:previous" || i.customId === "pagination:next"),
            time: 600000,
        });
        collector.on("collect", async i => {
            if (i.customId === "pagination:previous")
                currPage--;
            else if (i.customId === "pagination:next")
                currPage++;

            components![components!.length - 1] = paginationButtons();

            await i.update({ content, embeds: [pages[currPage]], components, files });
        });

        collector.on("end", async () => {
            // Delete the pagination buttons
            components!.pop();
            await message.edit({ content, embeds: [pages[currPage]], components, files });
        });
    }

    return message;
}