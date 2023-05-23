import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, ForumChannel, Message, MessageComponentInteraction, ThreadChannel } from "discord.js";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";
import { Tournament } from "../../../Models/tournaments/tournament";
import { TournamentChannel, TournamentChannelType } from "../../../Models/tournaments/tournamentChannel";
import { discordClient } from "../../../Server/discord";
import { randomUUID } from "crypto";
import respond from "../respond";

export default async function getCustomThread (m: Message | ChatInputCommandInteraction, mappoolMap: MappoolMap, tournament: Tournament, slot: string): Promise<[ThreadChannel, Message] | boolean | undefined> {
    const content = `Map: **${mappoolMap.customBeatmap ? `${mappoolMap.customBeatmap.artist} - ${mappoolMap.customBeatmap.title} [${mappoolMap.customBeatmap.difficulty}]` : "N/A"}**\nMapper(s): **${mappoolMap.customMappers.length > 0 ? mappoolMap.customMappers.map(u => `<@${u.discord.userID}>`).join(" ") : "N/A"}**\nTestplayer(s): **${mappoolMap.testplayers.length > 0 ? mappoolMap.testplayers.map(u => `<@${u.discord.userID}>`).join(" ") : "N/A"}**\nDeadline: ${mappoolMap.deadline ? `<t:${mappoolMap.deadline.getTime() / 1000}:F> (<t:${mappoolMap.deadline.getTime() / 1000}:R>)` : "**N/A**"}`;

    if (!mappoolMap.customThreadID) {
        const tourneyChannels = await TournamentChannel.find({
            where: {
                tournament: {
                    ID: tournament.ID,
                }
            }
        });
        const tournamentChannel = tourneyChannels.find(c => c.channelType === TournamentChannelType.Mappoolqa);
        const mappoolChannel = discordClient.channels.cache.get(tournamentChannel?.channelID ?? "");
        if (!(mappoolChannel && mappoolChannel.type === ChannelType.GuildForum))
            return true;
    
        const forumChannel = mappoolChannel as ForumChannel;
        const ids = {
            stop: randomUUID(),
            create: randomUUID(),
        }
        const threadMessage = await m.channel!.send({
            content: `Is there a thread for this map already? Or should I create one in <#${forumChannel.id}>? If there already is a thread, paste the thread's ID.`,
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(ids.stop)
                            .setLabel("STOP COMMAND")
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId(ids.create)
                            .setLabel("Create thread")
                            .setStyle(ButtonStyle.Primary))
                        
            ],
        });
        return new Promise<[ThreadChannel, Message] | undefined>((resolve) => {
            const filter = (msg: Message | MessageComponentInteraction) => (msg instanceof Message ? msg.author.id : msg.user.id) === (m instanceof Message ? m.author.id : m.user.id);
            const confirmationCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
            const idCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });
            confirmationCollector.on("collect", async (i: MessageComponentInteraction) => {
                if (i.customId === ids.stop) {
                    await i.reply("Stopped command.");
                    setTimeout(async () => await i.deleteReply(), 5000);
                    confirmationCollector.stop();
                    idCollector.stop();
                    resolve(undefined);
                } else if (i.customId === ids.create) {
                    await i.reply("Creating thread...");
                    const createObj = {
                        name: `${slot} (${mappoolMap.customMappers.map(u => u.osu.username).join(", ")})`,
                        message: { content },
                    }
                    const thread = await forumChannel.threads.create(createObj);
                    const threadMsg = await thread.fetchStarterMessage();
                    await i.deleteReply();
                    resolve([thread, threadMsg!]);
                    confirmationCollector.stop();
                    idCollector.stop();
                }
            });
    
            idCollector.on("collect", async (msg: Message) => {
                if (msg.content.match(/\d+/)) {
                    // Check if valid thread channel
                    const id = msg.content.match(/\d+/)![0];
                    const ch = await discordClient.channels.fetch(msg.content);
                    if (!ch || !(ch instanceof ThreadChannel) || ch.parentId !== forumChannel.id) {
                        const reply = await msg.reply(`Could not find thread channel with id ${id} <#${id}> within the forum channel <#${forumChannel.id}>`);
                        setTimeout(async () => await reply.delete(), 5000);
                        return;
                    }
                    
                    const wait = await m.channel!.send("Changing thread name... (this may take a while if rate limited)");
                    await ch.setName(`${slot} (${mappoolMap.customMappers.map(u => u.osu.username).join(", ")})`);
                    await wait.delete();
                    const threadMsg = await ch.send(content);
    
                    resolve([ch, threadMsg]);
                    confirmationCollector.stop();
                    idCollector.stop();
                }
            });
            idCollector.on("end", async () => {
                await threadMessage.delete();
                resolve(undefined);
            });
        });
    }

    const ch = await discordClient.channels.fetch(mappoolMap.customThreadID);
    if (!ch || !(ch instanceof ThreadChannel)) {
        await respond(m, `Could not find thread for **${slot}** which should be <#${mappoolMap.customThreadID}> (ID: ${mappoolMap.customThreadID})`);
        return;
    }

    const thread = ch as ThreadChannel;
    await thread.setArchived(false);
    const threadMsg = await thread.messages.fetch(mappoolMap.customMessageID!);
    if (!threadMsg) {
        await respond(m, `Could not find thread message for **${slot}** which should be https://discord.com/channels/${thread.guild.id}/${mappoolMap.customThreadID}/${mappoolMap.customMessageID} (ID: ${mappoolMap.customMessageID})`);
        return;
    }

    const wait = await m.channel!.send("Changing thread name... (this may take up to 10 minutes if rate limited as discord API only allows bots to change thread names ~2 times per 10 min.)");
    await thread.setName(`${slot} (${mappoolMap.customMappers.map(u => u.osu.username).join(", ")})`);
    await Promise.all([
        wait.delete(),
        threadMsg.edit(content)
    ]);

    return [thread, threadMsg];
}