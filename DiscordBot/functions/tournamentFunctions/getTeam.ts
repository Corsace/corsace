import { ChatInputCommandInteraction, Message } from "discord.js";
import getTeams, { teamSearchConditions } from "../../../Server/functions/get/getTeams";
import getFromList from "../getFromList";
import respond from "../respond";


export default async function getTeam (m: Message | ChatInputCommandInteraction, targets: (string | number)[], searchType: (keyof typeof teamSearchConditions)[], getInvites?: boolean, getTournaments?: boolean) {
    if (targets.length === 0 || searchType.length === 0 || targets.length !== searchType.length) {
        await respond(m, "NO/UNEQUAL AMOUNTS OF TARGETS AND SEARCH TYPES PROVIDED .");
        return;
    }

    const teams = await getTeams(targets, searchType, getInvites, getTournaments);
    if (teams.length === 0) {
        await respond(m, `NO TEAMS FOUND WITH THE PROVIDED QUERIES \`${targets.join(", ")}\` AND SEARCH TYPES \`${searchType.join(", ")}\` .`);
        return;
    }

    const team = await getFromList(m, teams, "team", targets.map(t => t.toString()).join(", "));
    if (!team)
        return;

    return team;
}