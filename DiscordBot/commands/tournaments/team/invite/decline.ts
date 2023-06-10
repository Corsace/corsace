import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../..";
import { extractParameter } from "../../../../functions/parameterFunctions";
import respond from "../../../../functions/respond";
import getTeam from "../../../../functions/tournamentFunctions/getTeam";
import commandUser from "../../../../functions/commandUser";
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

    const invites = await getTeamInvites(team.ID, "teamID", user.ID, "userID");
    if (invites.length === 0) {
        await respond(m, `U haven't been invited to \`${team.name}\``);
        return;
    }
    if (invites.length > 1) {
        await respond(m, `U have been invited to \`${team.name}\` multiple times which shouldn't happen ever, contact VINXIS`);
        return;
    }

    const invite = invites[0];
    await invite.remove();

    await respond(m, `Declined the invite to \`${team.name}\``);
}

const data = new SlashCommandBuilder()
    .setName("invite_accept")
    .setDescription("Invite a player to your team")
    .addStringOption(option => 
        option.setName("team")
            .setDescription("The team you want to invite the player to")
            .setRequired(true)
    );

const teamInvite: Command = {
    data,
    alternativeNames: ["invite_accept", "accept_invite", "invite-accept", "accept-invite", "acceptinvite", "inviteaccept", "invitet", "tinvite", "accepti", "iaccept"],
    category: "tournaments",
    subCategory: "teams/invites",
    run,
};

export default teamInvite;