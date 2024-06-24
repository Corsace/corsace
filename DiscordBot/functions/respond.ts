import { APIActionRowComponent, APIEmbed, APIMessageActionRowComponent, ActionRowBuilder, AttachmentPayload, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, JSONEncodable, Message } from "discord.js";
import { EmbedPage, enforceEmbedLimits, paginateEmbed } from "./embedHandlers";
import commandUser from "./commandUser";

export default async function respond (m: Message | ChatInputCommandInteraction, content?: string, embeds?: (APIEmbed | JSONEncodable<APIEmbed>)[], components?: JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>[], files?: AttachmentPayload[]) {
    let pages: EmbedPage[] = [];
    let currPage = 0;
    if (embeds) {
        // Can't paginate if there are multiple embeds or if there are 5 components
        if (embeds.length > 1 || (components && components.length === 5))
            embeds = embeds.map(e => enforceEmbedLimits(e));
        else {
            pages = paginateEmbed(enforceEmbedLimits(embeds[0]));
            if (pages.length > 1)
                embeds[0] = {...embeds[0], description: pages[0].description, fields: pages[0].fields};
        }
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

    if (pages.length > 1) { // Paginate the embed description/fields
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

        if (components)
            components.push(paginationButtons());
        else
            components = [paginationButtons()];

        await message.edit({ content, embeds, components, files });

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

            await message.edit({ content, embeds: [{ ...embeds![0], description: pages[currPage].description, fields: pages[currPage].fields }], components, files });
        });

        collector.on("end", async () => {
            // Delete the pagination buttons
            components!.pop();
            await message.edit({ content, embeds: [{ ...embeds![0], description: pages[currPage].description, fields: pages[currPage].fields }], components, files });
        });
    }

    return message;
}