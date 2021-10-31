import { Message } from "discord.js";
import { appendToHistory, getPoolData, updatePoolRow } from "../../../Server/sheets";
import { Command } from "../index";
import mappoolFunctions from "../../functions/mappoolFunctions";
import Axios from "axios";
import AdmZip from "adm-zip";
import osu from "ojsama";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, true, false, true)))
        return;

    const waiting = await m.channel.send("Submitting...");
    let message: Message | undefined = undefined;
    let success = false;
    try {
        const { pool, slot, round, link, diffName } = await mappoolFunctions.parseParams(m);

        if (link === "") {
            message = await m.channel.send("No attachment is provided");
            return;
        }
        if (round === "") {
            message = await m.channel.send("No round is provided");
            return;
        }

        // Obtain beatmap data
        let diff = diffName.replace(/_/g, " ");
        let artist = "";
        let title = "";
        let length = "";
        let bpm = "";
        let sr = "";
        let cs = 0;
        let ar = 0;
        let od = 0;
        let hp = 0;
        const { data } = await Axios.get(link, { responseType: "arraybuffer" });
        const zip = new AdmZip(data);
        const osuParser = new osu.parser();
        const zipEntries = zip.getEntries().filter(entry => entry.entryName.includes(".osu"));
        for (const file of zipEntries) {
            const beatmap = osuParser.feed(zip.readAsText(file)).map;
            if (diff !== "" && beatmap.version.toLowerCase() !== diff.toLowerCase())
                continue;

            artist = beatmap.artist;
            title = beatmap.title;
            diff = beatmap.version;
            cs = beatmap.cs;
            ar = beatmap.ar!;
            od = beatmap.od;
            hp = beatmap.hp;

            // Obtaining length
            const lengthMs = beatmap.objects[beatmap.objects.length - 1].time - beatmap.objects[0].time;
            const lengthSec = lengthMs / 1000;
            const lengthMin = Math.round(lengthSec / 60);
            length = `${lengthMin}:${(lengthSec % 60).toFixed(0)}`;

            // Obtaining bpm
            const timingPoints = beatmap.timing_points.filter(line => line.change === true).map(line => {
                return 60000 / line.ms_per_beat;
            }).sort((a,b) => a - b);
            if (timingPoints.length === 1)
                bpm = timingPoints[0] % 1 !== 0 ? timingPoints[0].toFixed(3) : timingPoints[0].toFixed();
            else
                bpm = `${timingPoints[0].toFixed()}-${timingPoints[timingPoints.length - 1].toFixed()}`;

            sr = new osu.std_diff().calc({map: beatmap}).total.toFixed(2);
            break;
        }
        if (artist === "") {
            message = await m.channel.send(`Could not find **${diffName !== "" ? `[${diff}]` : "a single difficulty(?)"}** in your osz`);
            return;
        }


        // Get pool data and iterate thru
        const rows = await getPoolData(pool, round.toUpperCase());
        if (!rows) {
            message = await m.channel.send(`Could not find round **${round.toUpperCase()}** in the **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** pool`);
            return;
        }
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.some(val => val === m.author.id)) {
                if (
                    (slot === "") || // no slot given
                    (slot !== "" && slot.toLowerCase() === row[0].toLowerCase()) // slot given
                ) {
                    await Promise.all([
                        updatePoolRow(pool, `'${round}'!C${i + 2}:M${i + 2}`, [ artist, title, diff, length, bpm, sr, cs, ar, od, hp, "" ]),
                        updatePoolRow(pool, `'${round}'!O${i + 2}`, [ link ]),
                        appendToHistory(pool, [ (new Date).toUTCString(), `${round.toUpperCase()}${slot ? slot.toUpperCase() : row[0].toUpperCase()}`, artist, title, m.member?.nickname ?? m.author.username, link ]),
                    ]);
                    message = await m.channel.send(`Submitted your map for the slot **${row[0].toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**\n${m.attachments.first() ? "**DO NOT DELETE YOUR MESSAGE, YOUR LINK IS THE ATTACHMENT.**" : ""}`);
                    success = true;
                    return;
                }
            }
        }
        message = await m.channel.send(`Could not find ${slot !== "" ? `the slot **${slot.toUpperCase()}**` : "a slot"} in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** which you were also assigned to.`);
    } finally {
        waiting.delete();
        if (message)
            message.delete({timeout: 5000});
        if (!success)
            m.delete({timeout: 5000});
    }
}

const mappoolSubmit: Command = {
    name: ["psubmit", "poolsubmit", "submitp", "submitpool"], 
    description: "Allows an assigned mapper to send a link / attachment for their finished/work in progress beatmap\nDefaults to NM -> HD -> HR -> DT -> FM -> TB\n\n**REPLACE SPACES IN YOUR DIFFICULTY NAME WITH UNDERSCORES IF YOU ARE USING `-diff`**",
    usage: "!psubmit <link / attachment> <round> [slot] [pool] [-diff <Diff_Name>]", 
    category: "mappool",
    command,
};

export default mappoolSubmit;