import { ChatInputCommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../index";
import { TournamentRoleType } from "../../../../../Models/tournaments/tournamentRole";
import modeColour from "../../../../functions/modeColour";
import { TournamentChannelType } from "../../../../../Models/tournaments/tournamentChannel";
import respond from "../../../../functions/respond";
import { securityChecks } from "../../../../functions/tournamentFunctions/securityChecks";
import { extractParameters } from "../../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import mappoolComponents from "../../../../functions/tournamentFunctions/mappoolComponents";
import { unFinishedTournaments } from "../../../../../Models/tournaments/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [TournamentChannelType.Admin], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]))
        return;

    const all = m instanceof Message ? m.content.includes("-a") : m.options.getBoolean("all");
    if (all && m instanceof Message)
        m.content = m.content.replace("-a", "");

    const params = extractParameters<parameters>(m, [
        { name: "pool", regex: /-p (\S+)/, regexIndex: 1 },
        { name: "slot", regex: /-s (\S+)/, regexIndex: 1, postProcess: postProcessSlotOrder, optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order } = params;

    const components = await mappoolComponents(m, pool, slot || true, order || true, false, { text: m.channelId, searchType: "channel" }, unFinishedTournaments, false, undefined, true);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;

    if ("mappoolMap" in components) {

        const { mappoolMap, mappoolSlot } = components;

        if (!mappoolMap.jobPost) {
            await respond(m, `**${mappoolSlot}** does not have a job board post.`);
            return;
        }

        await respond(m, `${mappoolSlot} job board post:\n\n${mappoolMap.jobPost.description}`);
        return;
    }

    const jobBoardEmbed = new EmbedBuilder()
        .setTitle(`${mappool.name} Job Board`)
        .setColor(modeColour(tournament.mode.ID - 1))
        .setFooter({
            text: `Requested by ${m.member?.user.username}#${m.member?.user.discriminator}`,
            iconURL: m.member?.avatar ?? undefined,
        })
        .setTimestamp();

    jobBoardEmbed.setFields(mappool.slots.map(slot => {
        return {
            name: `**${slot.name}**`,
            value: slot.maps.map(map => `**${slot.acronym}${map.order}:** ${map.jobPost && (all ? true : !map.jobPost.jobBoardThread) ? map.jobPost.description : "N/A"}`).join("\n\n"),
        }
    }));

    await respond(m, undefined, [jobBoardEmbed]);
}

const data = new SlashCommandBuilder()
    .setName("job_info")
    .setDescription("See info for a slot's job board.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to see the job board post for.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to see the job board post for.")
            .setRequired(false))
    .addBooleanOption(option =>
        option.setName("all")
            .setDescription("False only shows unpublished job board posts.")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    pool: string,
    slot?: string,
    order?: number,
}

const jobInfo: Command = {
    data,
    alternativeNames: [ "info_job", "job-info", "info-job", "jobinfo", "infojob", "infoj", "jinfo", "job_i", "i_job", "job-i", "i-job", "jobi", "ijob", "ij", "ji" ],
    category: "tournaments",
    subCategory: "mappools/jobs",
    run,
};

export default jobInfo;