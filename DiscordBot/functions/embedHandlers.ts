import { APIEmbed, APIEmbedAuthor, APIEmbedField, APIEmbedFooter, JSONEncodable, RestOrArray } from "discord.js";
import truncate from "../../Server/utils/truncate";

export interface EmbedPage {
    description: string;
    fields: APIEmbedField[];
}

export class EmbedBuilder {
    public embed: APIEmbed;

    constructor () {
        this.embed = {};
    }

    public setTitle (title: string) {
        this.embed.title = truncate(title, 256);
        return this;
    }

    public setDescription (description: string) {
        this.embed.description = truncate(description, 4096);
        return this;
    }

    public setColor (color: number) {
        this.embed.color = color;
        return this;
    }

    public setTimestamp (timestamp: Date) {
        // ISO 8601 format string according to https://discord.com/developers/docs/resources/channel#embed-object-embed-structure
        this.embed.timestamp = timestamp.toISOString();
        return this;
    }

    public setFooter ({ icon_url, text }: APIEmbedFooter) {
        this.embed.footer = { icon_url, text: truncate(text, 2048) };
        return this;
    }

    public setThumbnail (url: string) {
        try {
            this.embed.thumbnail = { url: new URL(url).toString() };
        } catch {
            this.embed.thumbnail = undefined;
        }
        return this;
    }

    public setImage (url: string) {
        try {
            this.embed.image = { url: new URL(url).toString() };
        } catch {
            this.embed.image = undefined;
        }
        return this;
    }

    public setAuthor ({ name, url, icon_url }: APIEmbedAuthor) {
        this.embed.author = { name: truncate(name, 256), url, icon_url };
        return this;
    }

    public addField ({ name, value, inline }: APIEmbedField) {
        if (!this.embed.fields)
            this.embed.fields = [];
        this.embed.fields.push({ name: truncate(name, 256), value: truncate(value, 1024), inline });
        return this;
    }

    public addFields (...fields: RestOrArray<APIEmbedField>) {
        if (!this.embed.fields)
            this.embed.fields = [];
        this.embed.fields.push(...fields.flat().map(f => ({
            name: truncate(f.name, 256),
            value: truncate(f.value, 1024),
            inline: f.inline,
        })));
        return this;
    }

    public build () {
        const pages: APIEmbed[] = [];
        let embedDescription = this.embed.description ?? "\u200b";
        let embedFields = this.embed.fields ?? [];
        pages.push({
            ...this.embed,
            description: embedDescription.length > 4096 ? embedDescription.slice(0, 4096) : embedDescription,
            fields: embedFields.length > 25 ? embedFields.slice(0, 25) : embedFields,
        });
        while (embedDescription.length > 4096 || embedFields.length > 25) {
            embedDescription = embedDescription.length > 4096 ? embedDescription.slice(4096) : pages[pages.length - 1].description ?? "";
            embedFields = embedFields.length > 25 ? embedFields.slice(25) : pages[pages.length - 1].fields ?? [];

            const description = embedDescription.length > 4096 ? embedDescription.slice(0, 4096) : embedDescription;
            const fields = embedFields.length > 25 ? embedFields.slice(0, 25) : embedFields;
            pages.push({
                ...this.embed,
                description,
                fields,
            });
        }

        pages.map(e => {
            while (this.characterCount(e) > 6000) {
                if (e.description)
                    e.description = e.description.length > 3 ? truncate(e.description, e.description.length - 3) : "\u200b";
                if (e.fields)
                    e.fields = e.fields.map(f => ({
                        name: f.name.length > 3 ? truncate(f.name, f.name.length - 3) : "\u200b",
                        value: f.value.length > 3 ? truncate(f.value, f.value.length - 3) : "\u200b",
                        inline: f.inline,
                    }));
            }

            return e;
        });

        return pages;
    }

    private characterCount (embed: APIEmbed = this.embed) {
        let count = 0;
        if (embed.title)
            count += embed.title.length;
        if (embed.description)
            count += embed.description.length;
        if (embed.footer?.text)
            count += embed.footer.text.length;
        if (embed.author?.name)
            count += embed.author.name.length;
        if (embed.fields)
            count += embed.fields.reduce((acc, f) => acc + f.name.length + f.value.length, 0);
        return count;
    }
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