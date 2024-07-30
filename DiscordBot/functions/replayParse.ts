import { Judgements, parseReplay, Replay } from "wasm-replay-parser-rs";
import { download } from "../../Server/utils/download";
import respond from "./respond";
import { ChatInputCommandInteraction, Message } from "discord.js";
import { MappoolMap } from "../../Models/tournaments/mappools/mappoolMap";

export const judgementKeys: (keyof Judgements)[] = [
    "count_300",
    "count_100",
    "count_50",
    "count_geki",
    "count_katu",
    "miss",
];

export async function replayParse (m: Message | ChatInputCommandInteraction, link: string, mappoolMap: MappoolMap): Promise<Replay | undefined> {
    const replayData = download(link);
    const data = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        replayData.on("data", chunk => chunks.push(chunk));
        replayData.on("end", () => resolve(Buffer.concat(chunks)));
        replayData.on("error", reject);
    });
    let replay: Replay;
    try {
        replay = parseReplay(data);
    } catch (e) {
        await respond(m, `Can't parse the replay. Make sure the link is valid. Error below:\n\`\`\`${e}\`\`\``);
        return;
    }

    const md5 = mappoolMap.customBeatmap?.md5 ?? mappoolMap.beatmap?.md5;
    if (md5 && replay.beatmap_hash !== md5) {
        await respond(m, `Replay is not meant for the currently selected beatmap. Please provide a replay for the correct current beatmap.`);
        return;
        // TODO: Uncomment when the corsace-parser can recompile .osr/.osu files
        // const ids: Record<string | number, string> = {
        //     yes: randomUUID(),
        //     no: randomUUID(),
        // };
        // const message = await m.channel!.send({
        //     content: `Replay is not meant for the currently selected beatmap. Should the replay be updated to the currently selected beatmap?`,
        //     components: [
        //         new ActionRowBuilder<ButtonBuilder>()
        //             .addComponents(
        //                 new ButtonBuilder()
        //                     .setCustomId(ids.yes)
        //                     .setLabel("Yes")
        //                     .setStyle(ButtonStyle.Success),
        //                 new ButtonBuilder()
        //                     .setCustomId(ids.no)
        //                     .setLabel("No")
        //                     .setStyle(ButtonStyle.Danger)
        //             ),
        //     ],
        // });
    
        // let stopped = false;
        // const filter = (i: MessageComponentInteraction) => i.user.id === commandUser(m).id;
        // const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
        // return new Promise((resolve) => {	
        //     componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
        //         if (i.customId === ids.no) {	
        //             stopped = true;	
        //             componentCollector.stop();	
        //             await i.reply("Replay not updated");
        //             await respond(m, "Replay not updated");
        //             setTimeout(async () => (await i.deleteReply()), 5000);	
        //             return;	
        //         }
        //         if (i.customId !== ids.yes) {
        //             await i.reply("Invalid response");
        //             setTimeout(async () => (await i.deleteReply()), 5000);
        //             return;
        //         }
        //         stopped = true;	
        //         componentCollector.stop();
        //         replay.beatmap_hash = md5;
        //         await i.reply("Replay updated");
        //         setTimeout(async () => (await i.deleteReply()), 5000);
        //         resolve(replay);
        //     });	
        //     componentCollector.on("end", () => timedOut(message, stopped, `Replay update`));
        // });
    }

    return replay;
}