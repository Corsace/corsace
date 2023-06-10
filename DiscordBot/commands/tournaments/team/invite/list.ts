import { ChatInputCommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../";
import commandUser from "../../../../functions/commandUser";
import respond from "../../../../functions/respond";
import getTeamInvites from "../../../../../Server/functions/get/getTeamInvites";
import getUser from "../../../../../Server/functions/get/getUser";
import { loginResponse } from "../../../../functions/loginResponse";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const invites = await getTeamInvites(user.ID, "userID", undefined, undefined, false, false, false, true);

    const embed = new EmbedBuilder()
        .setTitle("Team Invites")
        .setDescription(`Showing ${invites.length} invites`)
        .setFields(invites.map(invite => {
            return {
                name: `${invite.team.name} (${invite.team.abbreviation})`,
                value: `Manager: ${invite.team.manager.osu.username} <@${invite.team.manager.discord.userID}> (${invite.team.manager.osu.userID})`,
            };
        }));

    await respond(m, undefined, [ embed ]);
}

const data = new SlashCommandBuilder()
    .setName("list_invites")
    .setDescription("Lists your tournament team invites");

const inviteList: Command = {
    data,
    alternativeNames: ["list_invite", "invites_list", "invite_list", "list-invites", "list-invite", "invites-list", "invite-list", "inviteslist", "invitelist", "listinvites", "listinvite", "listi", "ilist", "invitel", "invitesl", "linvite", "linvites"],
    category: "tournaments",
    subCategory: "teams/invites",
    run,
};

export default inviteList;