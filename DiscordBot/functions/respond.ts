import { APIActionRowComponent, APIEmbed, APIMessageActionRowComponent, AttachmentPayload, ChatInputCommandInteraction, JSONEncodable, Message } from "discord.js";

export default async function respond (m: Message | ChatInputCommandInteraction, content?: string, embeds?: (APIEmbed | JSONEncodable<APIEmbed>)[], components?: JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>[], files?: AttachmentPayload[]) {
    if (m instanceof Message)
        return await m.reply({ content, embeds, components, files });
    else
        return await m.editReply({ content, embeds, components, files });
}