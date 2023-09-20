import { ForumChannel, Message, ThreadChannel } from "discord.js";
import { discordClient } from "../../../Server/discord";
import { JobPost } from "../../../Models/tournaments/mappools/jobPost";
import mappoolLog from "../../functions/tournamentFunctions/mappoolLog";
import respond from "../../functions/respond";
import confirmCommand from "../../functions/confirmCommand";
import { mappoolComponentsThreadType } from "../../functions/tournamentFunctions/mappoolComponentsThread";
import { parseDateOrTimestamp, discordStringTimestamp } from "../../../Server/utils/dateParse";

export async function jobBoardCreate (t: ThreadChannel, { m, creator, tournament, mappoolMap }: mappoolComponentsThreadType) {
    let jobPost = new JobPost();
    if (mappoolMap.jobPost)
        jobPost = mappoolMap.jobPost;
    
    jobPost.createdBy = creator;

    const starterMessage = await t.fetchStarterMessage();
    if (!starterMessage) {
        await respond(m, "Can't get the starter message");
        return;
    }
     
    if (jobPost.description && !await confirmCommand(m, `This job already has a description.\n${jobPost.description}\n\n Do u wanna overwrite it with the thread starter message?\n${starterMessage.content}`, false))
        return;

    jobPost.description = starterMessage.content;

    if (jobPost.deadline) {
        await m.channel.send(`This job already has a deadline. Do u wanna use its deadline? If so, reply \`yes\` or \`y\` If not, provide the date in YYYY-MM-DD or a unix/epoch timestamp.\n\n${jobPost.deadline ? discordStringTimestamp(jobPost.deadline) : "**N/A**"}`);
        
        const filter = (msg: Message) => msg.author.id === creator.discord.userID;
        const collected = await m.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] });
        const response = collected.first();
        if (!response)
            return;
        
        if (response.content.toLowerCase() === "yes" || response.content.toLowerCase() === "y") {
            const date = new Date(parseDateOrTimestamp(response.content));
            if (isNaN(date.getTime()) || date.getTime() < Date.now()) {
                m.channel.send("Invalid date.");
                return;
            }

            jobPost.deadline = date;
        }
    }

    if (jobPost.jobBoardThread) {
        const confirm = await confirmCommand(m, "This map already has a thread. Do u wanna to create a new one?", false);
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

    await respond(m, `Created job post.\nNote that \`job\` will not be able to edit this job post. If u wanna edit it, then do so manually`);

    await mappoolLog(tournament, "threadCreate", creator, `Created job post thread for \`${t.name}\` <#${t.id}>`);
    return;
}

export async function jobBoardDelete (t: ThreadChannel, { m, creator, tournament, mappoolMap }: mappoolComponentsThreadType) {
    const jobPost = mappoolMap.jobPost;
    if (!jobPost)
        return;

    const confirm = await confirmCommand(m, `<@${creator.discord.userID}> Do u wanna remove the job board post associated with the map now that u deleted the thread **${t.name}**? Selecting no will simply bring it back to its pre-published state`, false);
    if (confirm) {
        mappoolMap.jobPost = null;
        await mappoolMap.save();
        await jobPost.remove();

        await respond(m, `Deleted thread for **${t.name}** and the associated job board post`);

        await mappoolLog(tournament, "threadDelete", creator, `Deleted thread for \`${t.name}\` and the associated job board post`);

        return;
    }

    jobPost.deadline = jobPost.jobBoardThread = null;
    await jobPost.save();

    await respond(m, `Deleted thread for **${t.name}** and brought the associated job board post to its pre-published state`);

    await mappoolLog(tournament, "threadDelete", creator, `Deleted thread for \`${t.name}\` and brought the associated job board post to its pre-published state`);

    return;
}