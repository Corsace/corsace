import { APIEmbed, APIEmbedField, JSONEncodable } from "discord.js";
import truncate from "../../Server/utils/truncate";

export interface EmbedPage {
    description: string;
    fields: APIEmbedField[];
}

export function enforceEmbedLimits (embed: APIEmbed | JSONEncodable<APIEmbed>): APIEmbed | JSONEncodable<APIEmbed> {
    if ("title" in embed && embed.title)
        embed.title = truncate(embed.title, 256);
    if ("description" in embed && embed.description)
        embed.description = truncate(embed.description, 2048);
    if ("footer" in embed && embed.footer?.text)
        embed.footer.text = truncate(embed.footer.text, 2048);
    if ("author" in embed && embed.author?.name)
        embed.author.name = truncate(embed.author.name, 256);
    if ("fields" in embed && embed.fields)
        embed.fields = embed.fields.map(f => ({
            name: f.name.length > 0 ? truncate(f.name, 256) : "No Name",
            value: f.value.length > 0 ? truncate(f.value, 1024) : "No Value",
            inline: f.inline,
        }));
    return embed;
}

export function paginateEmbed (embed: APIEmbed | JSONEncodable<APIEmbed>): EmbedPage[] {
    const pages: EmbedPage[] = [];
    let description = "description" in embed && embed.description ? embed.description : "";
    let fields = "fields" in embed && embed.fields ? embed.fields : [];
    while (description.length > 0 || fields.length > 0) {
        // Remove upto 2048 characters from the description, and upto 25 fields from the fields array into a new page
        pages.push({
            description: description.length > 0 ? description.slice(0, 2048) : pages.length === 0 ? "" : pages[pages.length - 1].description,
            fields: fields.length > 0 ? fields.splice(0, 25) : pages.length === 0 ? [] : pages[pages.length - 1].fields,
        });
        description = description.length > 2048 ? description.slice(2048) : "";
        fields = fields.length > 25 ? fields.splice(25) : [];
    }
    return pages;
}