import { Message } from "discord.js";
import { appendSongSubmission } from "../../../Server/sheets";

const artistRegex = /artist:\s+(.+)/i;
const titleRegex = /title:\s+(.+)/i;
const genreRegex = /genre:\s+(.+)/i;
const bpmRegex = /bpm:\s+(.+)/i;
const lengthRegex = /length:\s+(.+)/i;
const slotRegex = /slot:\s+(.+)/i;
const linkRegex = /link:\s+(.+)/i;
const ratingRegex = /rating:\s+(.+)/i;
const noteRegex = /note:\s+(.+)/i;

export default async function mappoolSong (m: Message, isOpen: boolean) {
    let artist = "";
    let title = "";
    let genre = "";
    let bpm = "";
    let length = "";
    let slot = "";
    let link = "";
    let rating = "";
    let note = "";

    const lines = m.content.split("\n");
    for (const line of lines) {
        if (artistRegex.test(line))
            artist = artistRegex.exec(line)![1];
        else if (titleRegex.test(line))
            title = titleRegex.exec(line)![1];
        else if (genreRegex.test(line))
            genre = genreRegex.exec(line)![1];
        else if (bpmRegex.test(line))
            bpm = bpmRegex.exec(line)![1];
        else if (lengthRegex.test(line))
            length = lengthRegex.exec(line)![1];
        else if (slotRegex.test(line))
            slot = slotRegex.exec(line)![1];
        else if (linkRegex.test(line))
            link = linkRegex.exec(line)![1].replace("<", "").replace(">", "");
        else if (ratingRegex.test(line))
            rating = ratingRegex.exec(line)![1];
        else if (noteRegex.test(line))
            note = noteRegex.exec(line)![1];
    }

    if (m.attachments.size > 0 && link === "")
        link = m.attachments.first()!.url;

    if (artist === "") {
        const message = await m.channel.send("Missing artist");
        await message.delete({timeout: 3000});
        await m.delete({timeout: 3000});
        return;
    }
    if (title === "") {
        const message = await m.channel.send("Missing title");
        await message.delete({timeout: 3000});
        await m.delete({timeout: 3000});
        return;
    }
    if (bpm === "") {
        const message = await m.channel.send("Missing BPM");
        await message.delete({timeout: 3000});
        await m.delete({timeout: 3000});
        return;
    }
    if (length === "") {
        const message = await m.channel.send("Missing length");
        await message.delete({timeout: 3000});
        await m.delete({timeout: 3000});
        return;
    }
    if (link === "") {
        const message = await m.channel.send("Missing link");
        await message.delete({timeout: 3000});
        await m.delete({timeout: 3000});
        return;
    }

    try {
        await appendSongSubmission(isOpen, [ artist, title, m.member?.nickname ?? m.author.username, link, genre, bpm, length, slot, rating, note, m.author.id ]);

        m.react("✅");
    } catch (e) {
        if (e) {
            const message = await m.channel.send(`An error occurred.\n${e}`);
            await message.delete({timeout: 3000});
            await m.delete({timeout: 3000});
            return;
        }
    }
}