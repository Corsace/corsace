import { ForumChannel, Message, ThreadChannel, User as DiscordUser } from "discord.js";
import { discordClient } from "../../../Server/discord";
import { JobPost } from "../../../Models/tournaments/mappools/jobPost";
import mappoolLog from "../../functions/tournamentFunctions/mappoolLog";
import respond from "../../functions/respond";
import confirmCommand from "../../functions/confirmCommand";
import mappoolComponentsThread from "../../functions/tournamentFunctions/mappoolComponentsThread";

export async function jobBoardCreate(t: ThreadChannel, owner: DiscordUser) {
    const components = await mappoolComponentsThread(t, owner);
    if (!components)
        return;

    const { m, creator, tournament, mappoolMap } = components;

    let jobPost = new JobPost();
    if (mappoolMap.jobPost)
        jobPost = mappoolMap.jobPost;
    
    jobPost.createdBy = creator;

    if (jobPost.description) {
        const starterMessage = await t.fetchStarterMessage();
        if (starterMessage) {
            const confirm = await confirmCommand(m, `This job already has a description.\n${jobPost.description}\n\n Do you want to overwrite it with the thread starter message?\n${starterMessage.content}`);
            if (confirm)
                jobPost.description = starterMessage.content;
        }
    }

    if (jobPost.deadline) {
        await m.channel.send(`This job already has a deadline. Do you want to use its deadline? If so, reply \`yes\` or \`y\` If not, provide the date in YYYY-MM-DD or a unix/epoch timestamp.\n\n${jobPost.deadline ? `<t:${jobPost.deadline.getTime() / 1000}:F> (<t:${jobPost.deadline.getTime() / 1000}:R>)` : "**N/A**"}`);
        
        const filter = (msg: Message) => msg.author.id === creator.discord.userID;
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

    await respond(m, "Please note that `job` will not be able to edit this job post. If you want to edit it, please do so manually.");

    await mappoolLog(tournament, "threadCreate", creator, `Created job post thread for \`${t.name}\` <#${t.id}>`);
    return;
}

export async function jobBoardDelete (t: ThreadChannel, owner: DiscordUser) {
    const components = await mappoolComponentsThread(t, owner);
    if (!components)
        return;

    const { m, creator, tournament, mappoolMap } = components;

    const jobPost = mappoolMap.jobPost;
    if (!jobPost)
        return;

    const confirm = await confirmCommand(m, "Do you want to remove the job board post associated with the map now that you deleted its thread? Selecting no will simply bring it back to its pre-published state.");
    if (confirm) {
        mappoolMap.jobPost = null;
        await mappoolMap.save();
        await jobPost.remove();

        await mappoolLog(tournament, "threadDelete", creator, `Deleted thread for ${t.name} and the associated job board post.`);

        m.reply("Deleted thread and the associated job board post.");

        return;
    }

    jobPost.deadline = jobPost.jobBoardThread = null;
    await jobPost.save();

    await mappoolLog(tournament, "threadDelete", creator, `Deleted thread for ${t.name} and brought the associated job board post to its pre-published state.`);

    m.reply("Deleted thread and brought the associated job board post to its pre-published state.");

    return;
}