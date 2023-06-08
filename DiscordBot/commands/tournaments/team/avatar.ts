import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../";
import { extractParameter } from "../../../functions/parameterFunctions";
import { uploadTeamAvatar } from "../../../../Server/functions/tournaments/teams/uploadTeamAvatar";
import respond from "../../../functions/respond";
import { getLink } from "../../../functions/getLink";
import commandUser from "../../../functions/commandUser";
import getTeam from "../../../functions/tournamentFunctions/getTeam";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();
        
    const link = getLink(m, "avatar");
    if (!link)
        return;

    if (!link.endsWith(".png") && !link.endsWith(".jpg") && !link.endsWith(".jpeg") && !link.endsWith(".gif")) {
        await respond(m, "Pleaseee provide a proper image OHG MYGODDD");
        return;
    }

    const name = extractParameter(m, { name: "name", paramType: "string" }, 1);
    if (!name || typeof name !== "string") {
        await respond(m, "Provide an actual team name");
        return;
    }

    const team = await getTeam(m, [name, commandUser(m).id], ["name", "managerDiscordID"]);
    if (!team)
        return;

    try {
        const avatarPath = await uploadTeamAvatar(team, link);
        
        // Update the team
        team.avatarURL = avatarPath;
        await team.save();

        await respond(m, "Avatar updated");
    } catch (err) {
        await respond(m, `Error saving avatar:\n${err}`);
    }
}

const data = new SlashCommandBuilder()
    .setName("team_avatar")
    .setDescription("Change the avatar for one of the teams you manage")
    .addStringOption(option => 
        option.setName("name")
            .setDescription("The name of your team")
            .setRequired(true)
    )
    .addAttachmentOption(option => 
        option.setName("avatar")
            .setDescription("The avatar")
            .setRequired(true)
    );

const teamAvatar: Command = {
    data,
    alternativeNames: ["avatar_team", "teams_avatar", "team_avatar", "avatar-teams", "avatar-team", "teams-avatar", "team-avatar", "teamsavatar", "teamavatar", "avatarteams", "avatarteam", "avatart", "tavatar", "teama", "teamsa", "ateam", "ateams", "ta", "at"],
    category: "tournaments",
    subCategory: "teams",
    run,
};

export default teamAvatar;