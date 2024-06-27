import { APIEmbed, APIEmbedAuthor, APIEmbedField, APIEmbedFooter, RestOrArray } from "discord.js";
import truncate from "../../Server/utils/truncate";

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

    public setURL (url: string) {
        try {
            this.embed.url = new URL(url).toString();
        } catch {
            this.embed.url = undefined;
        }
        return this;
    }

    public setColor (color: number) {
        this.embed.color = color;
        return this;
    }

    public setTimestamp (timestamp: Date = new Date()) {
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