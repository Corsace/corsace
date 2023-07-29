import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../index";
import modeColour from "../../../../functions/modeColour";
import respond from "../../../../functions/respond";
import { securityChecks } from "../../../../functions/tournamentFunctions/securityChecks";
import { extractParameters } from "../../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import mappoolComponents from "../../../../functions/tournamentFunctions/mappoolComponents";
import { unFinishedTournaments } from "../../../../../Models/tournaments/tournament";
import channelID from "../../../../functions/channelID";
import { TournamentRoleType, TournamentChannelType } from "../../../../../Interfaces/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]))
        return;

    const all = m instanceof Message ? m.content.includes("-a") : m.options.getBoolean("all");
    if (all && m instanceof Message)
        m.content = m.content.replace("-a", "");

    const params = extractParameters<parameters>(m, [
        { name: "pool", paramType: "string" },
        { name: "slot", paramType: "string", postProcess: postProcessSlotOrder, optional: true },
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

        await respond(m, `${mappoolSlot} job board post:\n\n${mappoolMap.jobPost.description}`);
        return;
    }

    const jobBoardEmbed = new EmbedBuilder()
        .setTitle(`${mappool.name} Job Board`)
        .setColor(modeColour(tournament.mode.ID - 1))
        .setFooter({
            text: `Requested by ${m.member?.user.username}`,
            iconURL: (m.member as GuildMember | null)?.displayAvatarURL() || undefined,
        })
        .setTimestamp();

    jobBoardEmbed.setFields(mappool.slots.map(slot => {
        return {
            name: `**${slot.name}**`,
            value: slot.maps.map(map => `**${slot.acronym}${slot.maps.length === 1 ? "" : map.order}:** ${map.jobPost && (all ? true : !map.jobPost.jobBoardThread) ? map.jobPost.description : map.jobPost?.jobBoardThread ? "**PUBLISHED**" : "N/A"}`).join("\n\n"),
        };
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