import { ChatInputCommandInteraction, Message} from "discord.js";
import { download } from "../../Server/utils/download";

export async function getLink (m: Message | ChatInputCommandInteraction, optionName: string, permanent: boolean, optional: boolean) {
    let link: string | undefined = undefined;
    if (m instanceof Message) {
        if (m.attachments.first())
            link = m.attachments.first()!.url;
        else if (/https?:\/\/\S+/.test(m.content)) {
            link = /https?:\/\/\S+/.exec(m.content)![0];
            m.content = m.content.replace(link, "");
        } else if (!optional) {
            await m.reply("Provide a link mannnnn");
            return;
        }
    } else {
        if (!m.channel && !optional) {
            await m.editReply("sorry man this onl yworks in channels");
            return;
        }
        const attachment = m.options.getAttachment(optionName);
        if (!attachment && !optional) {
            await m.editReply("Provide a link mannnnn");
            return;
        }
        if (attachment) {
            const newLink = attachment.url;
            if (permanent) {
                const data = download(newLink);
                try {
                    const message = await m.channel!.send({
                        files: [
                            {
                                attachment: data,
                                name: attachment.name,
                            },
                        ],
                    });
                    link = message.attachments.first()!.url;
                } catch (e) {
                    console.error(e);
                    await m.editReply("Something went wrong");
                    return;
                }
            } else
                link = newLink;
        }
    }
    return link;
}