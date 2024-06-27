import { Message } from "discord.js";
import { config } from "node-config-ts";
import { EmbedBuilder } from "../../functions/embedBuilder";
import respond from "../../functions/respond";

export default async function osuTimestamp (m: Message) {
    const timestampRegex = /(\d+):(\d{2}):(\d{3})\s*(\(((\d,?)+)\))?/gmi;

    const timestamps = m.content.match(timestampRegex);
    if (!timestamps)
        return;

    const embed = new EmbedBuilder()
        .setTitle("osu! timestamp(s) found");

    let timestampList = "";
    for (const timestamp of timestamps) {
        const res = timestampRegex.exec(timestamp);
        timestampRegex.lastIndex = 0;
        if (!res)
            continue;
        timestampList += `[${timestamp}](${config.corsace.publicUrl}/api/osuuri/edit?time=${res[1]}:${res[2]}:${res[3]}`;
        if (res[4])
            timestampList += `-${res[4]}`;
        timestampList += ")\n";
    }
    const description = `Timestamps from https://discord.com/channels/${m.guild?.id ?? "@me"}/${m.channelId}/${m.id}\n\n${timestampList}`;

    const splits = description.split("\n").reduce((acc: string[], line: string) => {
        const last = acc[acc.length - 1];
        if (last && (last + line).length <= 4096)
            acc[acc.length - 1] += line + "\n";
        else
            acc.push(line + "\n");
        return acc;
    }, []);

    for (const desc of splits) {
        embed.setDescription(desc);
        await respond(m, undefined, embed);
    }
}