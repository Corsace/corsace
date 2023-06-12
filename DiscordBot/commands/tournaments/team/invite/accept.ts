import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../..";
import { extractParameter } from "../../../../functions/parameterFunctions";
import respond from "../../../../functions/respond";
import getTeam from "../../../../functions/tournamentFunctions/getTeam";
import commandUser from "../../../../functions/commandUser";
import { inviteAcceptChecks } from "../../../../../Server/functions/tournaments/teams/inviteFunctions";
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

    const name = extractParameter(m, { name: "name", paramType: "string" }, 1);
    if (!name || typeof name !== "string") {
        await respond(m, "Provide an actual team name");
        return;
    }

    const team = await getTeam(m, name, "name", user.ID);
    if (!team)
        return;

    const invites = await getTeamInvites(team.ID, "teamID", user.ID, "userID", true, true, true);
    if (invites.length === 0) {
        await respond(m, `U haven't been invited to \`${team.name}\``);
        return;
    }
    if (invites.length > 1) {
        await respond(m, `U have been invited to \`${team.name}\` multiple times which shouldn't happen ever, contact VINXIS`);
        return;
    }
    const invite = invites[0];

    const check = await inviteAcceptChecks(invite);
    if (check !== true) {
        await respond(m, check);
        return;
    }

    team.members.push(invite.user);
    await team.save();

    await invite.remove();

    await respond(m, `U have accepted the invite to \`${team.name}\``);
}

const data = new SlashCommandBuilder()
    .setName("invite_accept")
    .setDescription("Accept an invite to a team")
    .addStringOption(option => 
        option.setName("team")
            .setDescription("The team you want to accept the invite to")
            .setRequired(true)
    );

const inviteAccept: Command = {
    data,
    alternativeNames: ["invite_accept", "accept_invite", "invite-accept", "accept-invite", "acceptinvite", "inviteaccept", "invitea", "ainvite", "accepti", "iaccept"],
    category: "tournaments",
    subCategory: "teams/invites",
    run,
};

export default inviteAccept;