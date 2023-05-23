import { ThreadChannel } from "discord.js";
import { TournamentChannel } from "../../Models/tournaments/tournamentChannel";
import { discordClient } from "../../Server/discord";
import { threadCommands } from "../commands";
import mappoolComponentsThread from "../functions/tournamentFunctions/mappoolComponentsThread";
 
export default async function threadCreate (t: ThreadChannel, newlyCreated: boolean) {
    if (!newlyCreated || !t.parentId || !t.ownerId || t.ownerId === discordClient.user!.id)
        return;

    const owner = await t.fetchOwner();
    if (!owner || !owner.user)
        return;

    const channel = await TournamentChannel.findOne({ where: { channelID: t.parentId } });
    if (!channel || !threadCommands[channel.channelType]) 
        return;

    const components = await mappoolComponentsThread(t, owner.user);
    if (!components)
        return;

    const command = threadCommands[channel.channelType]!;

    await command.create(t, components);
    await components.m.delete();
}