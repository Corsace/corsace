import { ChatInputCommandInteraction, Message } from "discord.js";
import getTeams, { teamSearchConditions } from "../../../Server/functions/get/getTeams";
import getFromList from "../getFromList";
import respond from "../respond";


export default async function getTeam (m: Message | ChatInputCommandInteraction, target: string | number, searchType: keyof typeof teamSearchConditions, managerID?: number, getInvites?: boolean, getTournaments?: boolean) {
    let teams = await getTeams(target, searchType, getInvites, getTournaments);
    if (teams.length === 0) {
        await respond(m, `NO TEAMS FOUND WITH THE PROVIDED QUERY (${searchType.toUpperCase()}: \`${target}\`)`);
        return;
    }

    if (managerID) {
        teams = teams.filter(t => t.manager.ID === managerID);
        if (teams.length === 0) {
            await respond(m, `NO TEAMS FOUND WITH THE PROVIDED QUERY (${searchType.toUpperCase()}: \`${target}\`) WHERE U'RE ALSO THE MANAGER`);
            return;
        }
    }

    const team = await getFromList(m, teams, "team", target.toString());
    if (!team)
        return;

    return team;
}