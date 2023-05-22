import { ChatInputCommandInteraction, Message, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Command } from "../../../index";
import { TournamentChannelType } from "../../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../../Models/tournaments/tournamentRole";
import { loginResponse } from "../../../../functions/loginResponse";
import { JobPost } from "../../../../../Models/tournaments/mappools/jobPost";
import { discordClient } from "../../../../../Server/discord";
import respond from "../../../../functions/respond";
import getUser from "../../../../functions/dbFunctions/getUser";
import commandUser from "../../../../functions/commandUser";
import { securityChecks } from "../../../../functions/tournamentFunctions/securityChecks";
import { extractParameters } from "../../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { extractTargetText } from "../../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import mappoolComponents from "../../../../functions/tournamentFunctions/mappoolComponents";
import { unFinishedTournaments } from "../../../../../Models/tournaments/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [TournamentChannelType.Admin], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]))
        return;

    const params = extractParameters<parameters>(m, [
        { name: "pool", regex: /-p (\S+)/, regexIndex: 1 },
        { name: "slot", regex: /-s (\S+)/, regexIndex: 1, postProcess: postProcessSlotOrder },
        { name: "description", customHandler: extractTargetText(3)}
    ]);
    if (!params)
        return;
    
    const { pool, slot, order, description } = params;

    const components = await mappoolComponents(m, pool, slot, order, true, { text: m.channelId, searchType: "channel" }, unFinishedTournaments, false, undefined, true);
    if (!components || !("mappoolMap" in components))
        return;

    const { mappoolMap, mappoolSlot } = components;

    if ((mappoolMap.customMappers && mappoolMap.customMappers.length > 0) || mappoolMap.beatmap) {
        await respond(m, `**${mappoolSlot}** is not a job board slot. There is no reason to create a job board post.`);
        return;
    }

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    if (!mappoolMap.jobPost)
        mappoolMap.jobPost = new JobPost();

    mappoolMap.jobPost.description = description;
    mappoolMap.jobPost.createdBy = user;

    if (mappoolMap.jobPost.jobBoardThread) {
        const ch = await discordClient.channels.fetch(mappoolMap.jobPost.jobBoardThread);
        if (!ch || !(ch instanceof ThreadChannel)) {
            await respond(m, `Could not find thread for **${slot}** which should be <#${mappoolMap.customThreadID}> (ID: ${mappoolMap.customThreadID})`);
            return;
        }
        const msg = await ch.fetchStarterMessage()
        if (!msg) {
            await respond(m, `Could not find starter message for **${slot}** which should be in <#${mappoolMap.customThreadID}> (ID: ${mappoolMap.customThreadID})`);
            return;
        }

        await msg.edit(`**${mappoolSlot}**\n${description}`);
    }

    await mappoolMap.jobPost.save();
    await mappoolMap.save();

    await respond(m, `Successfully created/edited job post for **${mappoolSlot}**:\n${description}`);
}

const data = new SlashCommandBuilder()
    .setName("job")
    .setDescription("Create/edit a job board post for a mappool slot.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to create/edit a job board post for.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to create/edit a job board post for.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("description")
            .setDescription("The description for the job post.")
            .setMaxLength(1024)
            .setRequired(true))
    .setDMPermission(false);

interface parameters {
    pool: string,
    slot: string,
    order: number,
    description: string,
}

const job: Command = {
    data,
    alternativeNames: [ "job_mappool", "mappool-job", "job-mappool", "mappooljob", "jobmappool", "jobp", "pjob", "pool_job", "job_pool", "pool-job", "job-pool", "pooljob", "jobpool", "mappool_j", "j_mappool", "mappool-j", "j-mappool", "mappoolj", "jmappool", "jp", "pj", "pool_j", "j_pool", "pool-j", "j-pool", "poolj", "jpool", "job_add", "add_job", "job-add", "add-job", "jobadd", "addjob", "addj", "jadd", "job_a", "a_job", "job-a", "a-job", "joba", "ajob", "aj", "ja", "job", "j", "job_edit", "edit_job", "job-edit", "edit-job", "jobedit", "editjob", "editj", "jedit", "job_e", "e_job", "job-e", "e-job", "jobe", "ejob", "ej", "je", "job", "j" ],
    category: "tournaments",
    subCategory: "mappools/jobs",
    run,
};

export default job;