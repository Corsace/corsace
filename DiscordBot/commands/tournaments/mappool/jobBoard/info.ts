import { ChatInputCommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../index";
import { fetchJobThread, fetchMappool, fetchSlot, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../../functions/tournamentFunctions";
import { TournamentRoleType } from "../../../../../Models/tournaments/tournamentRole";
import modeColour from "../../../../functions/modeColour";
import { TournamentChannelType } from "../../../../../Models/tournaments/tournamentChannel";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild)
        return;

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const securedChannel = await isSecuredChannel(m, [TournamentChannelType.Admin]);
    if (!securedChannel) 
        return;

    const tournament = await fetchTournament(m);
    if (!tournament) 
        return;

    const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]);
    if (!allowed) 
        return;

    const forumChannel = await fetchJobThread(m, tournament);
    if (!forumChannel)
        return;

    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[2] : m.options.getString("slot");
    if (!poolText) {
        if (m instanceof Message) m.reply("Missing parameters. Please use `-p <pool> [-s <slot>]` or `<pool> [slot]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        else m.editReply("Missing parameters. Please use `/job_info <pool> [slot]`.");
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[0];

    const mappool = await fetchMappool(m, tournament, pool, false, slotText ? false : true, slotText ? false : true);
    if (!mappool) 
        return;

    if (slotText) {
        const slot = (typeof slotText === "string" ? slotText.substring(0, slotText.length - 1) : slotText[1].substring(0, slotText[1].length - 1)).toUpperCase();
        const order = parseInt(typeof slotText === "string" ? slotText.substring(slotText.length - 1) : slotText[1].substring(slotText[1].length - 1));

        if (isNaN(order)) {
            if (m instanceof Message) m.reply("Invalid slot number. Please use a valid slot number.");
            else m.editReply("Invalid slot number. Please use a valid slot number.");
            return;
        }
        const mappoolSlot = `${mappool.abbreviation.toUpperCase()} ${slot}${order}`;

        const slotMod = await fetchSlot(m, mappool, slot.toString(), true);
        if (!slotMod) 
            return;
        
        const mappoolMap = slotMod.maps.find(m => m.order === order);
        if (!mappoolMap) {
            if (m instanceof Message) m.reply(`Could not find **${mappoolSlot}**`);
            else m.editReply(`Could not find **${mappoolSlot}**`);
            return;
        }

        if (!mappoolMap.jobPost) {
            if (m instanceof Message) m.reply(`**${mappoolSlot}** does not have a job board post.`);
            else m.editReply(`**${mappoolSlot}** does not have a job board post.`);
            return;
        }

        if (m instanceof Message) m.reply(`${mappoolSlot} job board post:\n\n${mappoolMap.jobPost.description}`);
        else m.editReply(`${mappoolSlot} job board post:\n\n${mappoolMap.jobPost.description}`);
        return;
    }

    const all = m instanceof Message ? m.content.includes("-a") : m.options.getBoolean("all");
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

    if (m instanceof Message) m.reply({ embeds: [jobBoardEmbed] });
    else m.editReply({ embeds: [jobBoardEmbed] });
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

const jobInfo: Command = {
    data,
    alternativeNames: [ "info_job", "job-info", "info-job", "jobinfo", "infojob", "infoj", "jinfo", "job_i", "i_job", "job-i", "i-job", "jobi", "ijob", "ij", "ji" ],
    category: "tournaments",
    subCategory: "mappools/jobs",
    run,
};

export default jobInfo;