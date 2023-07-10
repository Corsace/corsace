import { ChatInputCommandInteraction, Message} from "discord.js";

export function getLink (m: Message | ChatInputCommandInteraction, optionName: string) {
    let link = "";
    if (m instanceof Message) {
        if (m.attachments.first())
            link = m.attachments.first()!.url;
        else if (/https?:\/\/\S+/.test(m.content)) {
            link = /https?:\/\/\S+/.exec(m.content)![0];
            m.content = m.content.replace(link, "");
        } else {
            m.reply("Provide a link mannnnn");
            return;
        }
    } else {
        const attachment = m.options.getAttachment(optionName);
        if (!attachment) {
            m.editReply("Provide a link mannnnn");
            return;
        }
        link = attachment.url;
    }
    return link;
}