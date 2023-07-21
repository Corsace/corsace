import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../";
import { extractParameters } from "../../../functions/parameterFunctions";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import { extractTargetText } from "../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import getTeam from "../../../functions/tournamentFunctions/getTeam";
import { User } from "../../../../Models/user";
import getFromList from "../../../functions/getFromList";
import { invitePlayer } from "../../../../Server/functions/tournaments/teams/inviteFunctions";
import { loginResponse } from "../../../functions/loginResponse";
import getUser from "../../../../Server/functions/get/getUser";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();
        
    const cmdUser = await getUser(commandUser(m).id, "discord", false);
    if (!cmdUser) {
        await loginResponse(m);
        return;
    }

    const params = extractParameters<parameters>(m, [
        { name: "team", paramType: "string", optional: true },
        { name: "user", paramType: "string", customHandler: extractTargetText },
    ]);
    if (!params)
        return;

    const { user, team } = params;

    const tournamentTeam = await getTeam(m, team || cmdUser.ID, team ? "name" : "managerID", cmdUser.ID, true, true);
    if (!tournamentTeam)
        return;
    
    const users = await User
        .createQueryBuilder("user")
        .select("user.ID")
        .addSelect("user.osuUsername")
        .where("user.osuUsername LIKE :username", { username: `%${user}%` })
        .orWhere("user.osuUserID = :userID", { userID: user })
        .getRawMany() as { user_ID: number, osuUsername: string }[];

    const baseUsers = users.map(u => {
        return {
            ID: u.user_ID,
            name: u.osuUsername,
        };
    });
    const baseUser = await getFromList(m, baseUsers, "user", user);
    if (!baseUser) {
        await respond(m, "Could not find a user with that name");
        return;
    }

    const targetUser = await User.findOne({ where: { ID: baseUser.ID }});
    if (!targetUser) {
        await respond(m, "Something went wrong, this should never happen, contact VINXIS");
        return;
    }

    const invite = await invitePlayer(tournamentTeam, targetUser);
    if (typeof invite === "string") {
        await respond(m, invite);
        return;
    }

    await invite.save();
    await respond(m, `Invited \`${targetUser.osu.username}\` to \`${tournamentTeam.name}\``);
}

const data = new SlashCommandBuilder()
    .setName("team_invite")
    .setDescription("Invite a player to your team")
    .addUserOption(option => 
        option.setName("user")
            .setDescription("The osu! username you want to invite to the team")
            .setRequired(true)
    )
    .addStringOption(option => 
        option.setName("team")
            .setDescription("The team you want to invite the player to")
            .setRequired(false)
    );

interface parameters {
    user: string,
    team?: string,
}

const teamInvite: Command = {
    data,
    alternativeNames: ["invite_team", "teams_invite", "invite_teams", "invite-teams", "invite-team", "teams-invite", "team-invite", "teamsinvite", "teaminvite", "inviteteams", "inviteteam", "invitet", "tinvite", "teami", "teamsi", "iteam", "iteams"],
    category: "tournaments",
    subCategory: "teams",
    run,
};

export default teamInvite;