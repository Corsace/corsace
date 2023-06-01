import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../index";
import { TournamentRoleType } from "../../../../../Models/tournaments/tournamentRole";
import { TournamentChannelType } from "../../../../../Models/tournaments/tournamentChannel";
import respond from "../../../../functions/respond";
import { securityChecks } from "../../../../functions/tournamentFunctions/securityChecks";
import { extractParameters } from "../../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import mappoolComponents from "../../../../functions/tournamentFunctions/mappoolComponents";
import { unFinishedTournaments } from "../../../../../Models/tournaments/tournament";
import channelID from "../../../../functions/channelID";
import confirmCommand from "../../../../functions/confirmCommand";
import { archiveJobThread } from "../../../../functions/tournamentFunctions/archiveMapThreads";
import mappoolLog from "../../../../functions/tournamentFunctions/mappoolLog";
import getUser from "../../../../functions/dbFunctions/getUser";
import commandUser from "../../../../functions/commandUser";
import { loginResponse } from "../../../../functions/loginResponse";
import { JobPost } from "../../../../../Models/tournaments/mappools/jobPost";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [TournamentChannelType.Admin], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const params = extractParameters<parameters>(m, [
        { name: "pool", regex: /-p (\S+)/, regexIndex: 1 },
        { name: "slot", regex: /-s (\S+)/, regexIndex: 1, postProcess: postProcessSlotOrder, optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order } = params;

    const components = await mappoolComponents(m, pool, slot || true, order || true, false, { text: channelID(m), searchType: "channel" }, unFinishedTournaments, false, undefined, true);
    if (!components || !("mappool" in components))
        return;

    if (!("mappoolMap" in components) && "slotMod" in components) {
        await respond(m, "Invalid slot");
        return;
    }

    const { tournament, mappool } = components;

    if ("mappoolMap" in components) {

        const { mappoolMap, mappoolSlot } = components;

        if (!mappoolMap.jobPost) {
            await respond(m, `**${mappoolSlot}** doesn't have a job board post`);
            return;
        }

        if (!await confirmCommand(m, `U sure u wanna delete the job board post for **${mappoolSlot}**?`)) {
            await respond(m, "Oh my god ok .");
            return;
        }
        
        await archiveJobThread(mappoolMap);

        const jobPost = mappoolMap.jobPost;

        mappoolMap.jobPost = null;
        await mappoolMap.save();

        await jobPost.remove();

        await Promise.all([
            respond(m, `Deleted the job board post for **${mappoolSlot}**`),
            mappoolLog(tournament, "deleteMappoolMapJob", user, `Deleted the job board post for \`${mappoolSlot}\``),
        ]);
        return;
    }

    if (!await confirmCommand(m, `U sure u wanna delete the job board posts for **${mappool.name} (${mappool.abbreviation})**?`)) {
        await respond(m, "Oh my god ok .");
        return;
    }

    const maps = mappool.slots.flatMap(slot => slot.maps);

    await Promise.all(maps.map(map => archiveJobThread(map)));

    const jobPosts = maps.map(map => map.jobPost).filter((jobPost): jobPost is JobPost => jobPost !== null && jobPost !== undefined);

    await Promise.all(maps.map(map => {
        map.jobPost = null;
        return map.save();
    }));

    await Promise.all(jobPosts.map(jobPost => jobPost.remove()));

    await Promise.all([
        respond(m, `Deleted the job board posts for **${mappool.name} (${mappool.abbreviation})**`),
        mappoolLog(tournament, "deleteMappoolJob", user, `Deleted the job board posts for \`${mappool.name} (${mappool.abbreviation})\``),
    ]);
}

const data = new SlashCommandBuilder()
    .setName("job_delete")
    .setDescription("Delete a slot's job post, or a pool's job post.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to delete (the) job post(s) from.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to delete the job post from.")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    pool: string,
    slot?: string,
    order?: number,
}

const jobDelete: Command = {
    data,
    alternativeNames: [ "delete_job", "job-delete", "delete-job", "jobdelete", "deletejob", "deletej", "jdelete", "job_del", "del_job", "job-del", "del-job", "jobdel", "deljob", "delj", "jdel", "job_d", "d_job", "job-d", "d-job", "jobd", "djob", "dj", "jd" ],
    category: "tournaments",
    subCategory: "mappools/jobs",
    run,
};

export default jobDelete;