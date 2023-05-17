import { ForumChannel, GuildMemberRoleManager, Message, ThreadChannel } from "discord.js";
import { TournamentChannel, TournamentChannelType } from "../../Models/tournaments/tournamentChannel";
import { discordClient } from "../../Server/discord";
import { confirmCommand, fetchMappool, fetchSlot, fetchStaff, fetchTournament, hasTournamentRoles, mappoolLog } from "../functions/tournamentFunctions";
import { User } from "../../Models/user";
import { TournamentRole, TournamentRoleType } from "../../Models/tournaments/tournamentRole";
import { JobPost } from "../../Models/tournaments/mappools/jobPost";

export default async function threadCreate (t: ThreadChannel, newlyCreated: boolean) {
    if (!newlyCreated || !t.parentId || !t.ownerId || t.ownerId === discordClient.user?.id)
        return;

    const owner = await t.fetchOwner();
    if (!owner || !owner.guildMember)
        return;

    const channel = await TournamentChannel.findOne({ where: { channelID: t.parentId } });
    if (!channel) 
        return;

    const creator = await User.findOne({ where: { discord: { userID: t.ownerId } } });
    if (!creator)
        return;

    const threadName = t.name;

    // Get the pool, slot, and mappers
    const poolRegex = /(\S+) (\S+)( \((.+)\))?/;
    const poolMatch = threadName.match(poolRegex);
    if (!poolMatch)
        return;

    const poolText = poolMatch[1];
    const slotText = poolMatch[2].slice(0, poolMatch[2].length - 1);
    const order = parseInt(poolMatch[2][poolMatch[2].length - 1]);
    const mappers = poolMatch[4] ? poolMatch[4].split(", ") : [];
    if (isNaN(order))
        return;

    const m = await t.send("Loading...");

    const tournament = await fetchTournament(m, [], false, false, false, true);
    if (!tournament)
        return;

    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const targetRoles = [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers];
    const allowedRoles = roles.filter(r => targetRoles.some(t => t === r.roleType));
    if (allowedRoles.length === 0) {
        m.reply(`There are no valid roles for this tournament. Please add ${targetRoles.map(t => t.toString()).join(", ")} roles first.`);
        return;
    }
    const allowed = (owner.guildMember.roles as GuildMemberRoleManager).cache.hasAny(...allowedRoles.map(r => r.roleID));
    if (!allowed) {
        m.reply("You are not a mappooler or organizer for this tournament.");
        return;
    }

    const mappool = await fetchMappool(m, tournament, poolText);
    if (!mappool)
    return;

    if (mappool.isPublic) {
        m.reply("This mappool is public. You can only create threads for private mappools.");
        return;
    }

    const slot = await fetchSlot(m, mappool, slotText, true);
    if (!slot)
        return;

    const mappoolMap = slot.maps.find(map => map.order === order);
    if (!mappoolMap)
        return;

    if (channel.channelType === TournamentChannelType.Mappoolqa) {
        const mapperUsers: User[] = [];
        for (const mapper of mappers) {
            const user = await fetchStaff(m, tournament, mapper, [TournamentRoleType.Mappers, TournamentRoleType.Mappoolers, TournamentRoleType.Organizer]);
            if (!user)
                return;

            mapperUsers.push(user);
        }

        // Check if custom mappers array is the same as mapperUsers
        if (mappoolMap.customMappers.length !== mapperUsers.length || !mappoolMap.customMappers.every(u => mapperUsers.some(u2 => u2.discord.userID === u.discord.userID))) {
            const confirm = await confirmCommand(m, `The mappers in the thread name do not match the mappers in the map. Do you want to overwrite the mappers in the map with the mappers in the thread name?\n\nThread mappers: ${mapperUsers.map(u => u.osu.username).join(", ")}\nMap mappers: ${mappoolMap.customMappers.map(u => u.osu.username).join(", ")}`);
            if (!confirm)
                return;
        }
        mappoolMap.assignedBy = creator;
        mappoolMap.customMappers = mapperUsers;
        
        if (mappoolMap.customThreadID) {
            const confirm = await confirmCommand(m, "This map already has a thread. Do you want to create a new one?");
            if (!confirm)
                return;

            const thread = await discordClient.channels.fetch(mappoolMap.customThreadID) as ThreadChannel | null;
            if (thread) {
                await thread.setAppliedTags([], "This thread has been remade.");
                await thread.setArchived(true, "This thread has been remade.");
            }
        }
        mappoolMap.customThreadID = t.id;

        const content = `Map: **${mappoolMap.customBeatmap ? `${mappoolMap.customBeatmap.artist} - ${mappoolMap.customBeatmap.title} [${mappoolMap.customBeatmap.difficulty}]` : "N/A"}**\nMapper(s): **${mappoolMap.customMappers.length > 0 ? mappoolMap.customMappers.map(u => `<@${u.discord.userID}>`).join(" ") : "N/A"}**\nTestplayer(s): **${mappoolMap.testplayers.length > 0 ? mappoolMap.testplayers.map(u => `<@${u.discord.userID}>`).join(" ") : "N/A"}**\nDeadline: ${mappoolMap.deadline ? `<t:${mappoolMap.deadline.getTime() / 1000}:F> (<t:${mappoolMap.deadline.getTime() / 1000}:R>)` : "**N/A**"}`;
        const threadMsg = await t.send(content);
        mappoolMap.customMessageID = threadMsg.id;
        
        await mappoolMap.save();

        await mappoolLog(tournament, "threadCreate", creator, `Created  QA thread for \`${t.name}\` <#${t.id}>`);
        return;
    }

    if (channel.channelType === TournamentChannelType.Jobboard) {
        let jobPost = new JobPost();
        if (mappoolMap.jobPost)
            jobPost = mappoolMap.jobPost;
        
        jobPost.createdBy = creator;

        if (jobPost.description) {
            const starterMessage = await t.fetchStarterMessage();
            if (starterMessage) {
                const confirm = await confirmCommand(m, `This job already has a description. Do you want to overwrite it with the thread starter message?\n\n${starterMessage.content}`);
                if (confirm)
                    jobPost.description = starterMessage.content;
            }
        }

        if (jobPost.deadline) {
            await m.channel.send(`This job already has a deadline. Do you want to use its deadline? If so, reply \`yes\` or \`y\` If not, provide the date in YYYY-MM-DD or a unix/epoch timestamp.\n\n${jobPost.deadline ? `<t:${jobPost.deadline.getTime() / 1000}:F> (<t:${jobPost.deadline.getTime() / 1000}:R>)` : "**N/A**"}`);
            
            const filter = (m: Message) => m.author.id === creator.discord.userID;
            const collected = await m.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] });
            const response = collected.first();
            if (!response)
                return;
            
            if (response.content.toLowerCase() === "yes" || response.content.toLowerCase() === "y") {
                const date = new Date(response.content.includes("-") ? response.content : parseInt(response.content + "000"));
                if (isNaN(date.getTime()) || date.getTime() < Date.now()) {
                    m.channel.send("Invalid date.");
                    return;
                }

                jobPost.deadline = date;
            }
        }

        if (jobPost.jobBoardThread) {
            const confirm = await confirmCommand(m, "This map already has a thread. Do you want to create a new one?");
            if (!confirm)
                return;

            const thread = await discordClient.channels.fetch(jobPost.jobBoardThread) as ThreadChannel | null;
            if (thread) {
                const tag = (thread.parent as ForumChannel).availableTags.find(t => t.name.toLowerCase() === "closed")?.id;
                if (tag) await thread.setAppliedTags([tag], "This thread is remade.");
                await thread.setArchived(true, "This thread is remade.");
            }
        }
        jobPost.jobBoardThread = t.id;

        await jobPost.save();        
        mappoolMap.jobPost = jobPost;
        await mappoolMap.save();

        await m.channel.send("Please note that `job` will not be able to edit this job post. If you want to edit it, please do so manually.");

        await mappoolLog(tournament, "threadCreate", creator, `Created job post thread for \`${t.name}\` <#${t.id}>`);
        return;
    }
}