import { Message } from "discord.js";

export default function osuTimestamp (m: Message, r: RegExp) {
    const timestamps = m.content.match(r);
    if (!timestamps)
        return;
    let message = "";
    for (const timestamp of timestamps) {
        const res = r.exec(timestamp);
        if (!res)
            continue;
        message += `<osu://edit/${res[1]}:${res[2]}:${res[3]}`;
        if (res[4])
            message += `-${res[4]}`;
        message += ">\n";
    }
    m.channel.send(message);
}