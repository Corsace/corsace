import { CorsaceRouter } from "../../../corsaceRouter";
import { TournamentRoleType } from "../../../../Interfaces/tournament";
import { MapStatus, MatchupList, Matchup as MatchupInterface, MatchupMessageBasic as MatchupMessageInterface } from "../../../../Interfaces/matchup";
import { Matchup, MatchupWithRelationIDs } from "../../../../Models/tournaments/matchup";
import { discordClient } from "../../../discord";
import { isLoggedInDiscord } from "../../../middleware";
import { hasRoles, validateTournament } from "../../../middleware/tournament";
import { parseQueryParam } from "../../../utils/query";
import dbMatchupToInterface from "../../../functions/tournaments/matchups/dbMatchupToInterface";
import { TournamentAuthenticatedState } from "koa";
import { TournamentChannel } from "../../../../Models/tournaments/tournamentChannel";
import { Team } from "../../../../Models/tournaments/team";
import { MatchupMessage } from "../../../../Models/tournaments/matchupMessage";

const refereeMatchupsRouter  = new CorsaceRouter<TournamentAuthenticatedState>();

//TODO: Look into making refereeRouter.use work for the middleware functions
refereeMatchupsRouter.$use(isLoggedInDiscord);
refereeMatchupsRouter.$use("/:tournamentID", validateTournament, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]));

refereeMatchupsRouter.$get<{ matchups: MatchupList[] }>("/:tournamentID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchupQ = Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("matchup.teams", "teams")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .andWhere("matchup.potentialForID IS NULL");
        
    const skip = parseInt(parseQueryParam(ctx.query.skip) ?? "") || 0;
    const matchups = await matchupQ
        .skip(skip)
        .take(5)
        .orderBy("stage.timespan.start", "DESC")
        .addOrderBy("matchup.date", "ASC")
        .getMany();

    ctx.body = {
        success: true,
        matchups: matchups.map((matchup) => {
            const teams: Team[] = [];
            if (matchup.team1) teams.push(matchup.team1);
            if (matchup.team2) teams.push(matchup.team2);
            if (matchup.teams) teams.push(...matchup.teams);
            return {
                ID: matchup.ID,
                matchID: matchup.matchID,
                date: matchup.date,
                mp: matchup.mp,
                forfeit: matchup.forfeit,
                teams: teams.map((team) => ({
                    ID: team.ID,
                    name: team.name,
                    abbreviation: team.abbreviation,
                    pp: team.pp,
                    rank: team.rank,
                    BWS: team.BWS,
                    members: [],
                })),
                team1Score: matchup.team1Score,
                team2Score: matchup.team2Score,
            };
        }),
    };
});

refereeMatchupsRouter.$get<{ matchup: MatchupInterface }>("/:tournamentID/:matchupID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const dbMatchup: MatchupWithRelationIDs = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.streamer", "streamer")
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID })
        .loadAllRelationIds({
            relations: ["winner", "round", "stage", "team1", "team2", "teams", "commentators", "sets"],
        })
        .getOne() as any;

    if (!dbMatchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found.",
        };
        return;
    }

    ctx.body = {
        success: true,
        matchup: await dbMatchupToInterface(dbMatchup),
    };
});

// TODO: Move this to an endpoint in api/routes/matchups.ts later when the matchup info page is implemented for cross-use
refereeMatchupsRouter.$get<{ messages: MatchupMessageInterface[] }>("/:tournamentID/:matchupID/messages", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const beforeID = parseInt(parseQueryParam(ctx.query.before) ?? "");
    const messagesQ = MatchupMessage
        .createQueryBuilder("message")
        .innerJoin("message.matchup", "matchup")
        .innerJoinAndSelect("message.user", "user")
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID });
    if (beforeID && !isNaN(beforeID) && beforeID > 0)
        messagesQ.andWhere("message.ID < :beforeID", { beforeID });

    const messages = await messagesQ
        .orderBy("message.ID", "DESC")
        .take(50)
        .getMany();

    if (messages.length === 0) {
        ctx.body = {
            success: true,
            messages: [],
        };
        return;
    }

    ctx.body = {
        success: true,
        messages: messages.map(message => ({
            ID: message.ID,
            content: message.content,
            timestamp: message.timestamp,
            user: {
                ID: message.user.ID,
                osu: {
                    userID: message.user.osu.userID,
                    username: message.user.osu.username,
                },
            },
        })) ?? [],
    };
});

interface postResultsSet {
    set: number;
    maps: postResultsMap[];
}
interface postResultsMap {
    name: string;
    status: MapStatus;
    team?: string;
}
function normalMatchText (team1Name: string, team2Name: string, maps: postResultsMap[]) {
    let textBuilder = "";

    const protects = maps.filter(m => m.status === MapStatus.Protected);
    if (protects.length > 0) {
        textBuilder += "\n\n__**Protects**__";
        textBuilder += `\n**${team1Name}**\n`;
        textBuilder += protects.filter((b: postResultsMap) => b.team === team1Name).map((b: postResultsMap) => `\`${b.name}\``).join("\n");
        textBuilder += "\n";
        textBuilder += `\n**${team2Name}**\n`;
        textBuilder += protects.filter((b: postResultsMap) => b.team === team2Name).map((b: postResultsMap) => `\`${b.name}\``).join("\n");
    }

    const bans = maps.filter(m => m.status === MapStatus.Banned);
    if (bans.length > 0) {
        textBuilder += "\n\n__**Bans**__";
        textBuilder += `\n**${team1Name}**\n`;
        textBuilder += bans.filter((b: postResultsMap) => b.team === team1Name).map((b: postResultsMap) => `\`${b.name}\``).join("\n");
        textBuilder += "\n";
        textBuilder += `\n**${team2Name}**\n`;
        textBuilder += bans.filter((b: postResultsMap) => b.team === team2Name).map((b: postResultsMap) => `\`${b.name}\``).join("\n");
    }

    return textBuilder;
}
function setBasedMatchText (team1Name: string, team2Name: string, maps: postResultsMap[], set: number) {
    let textBuilder = `\n\nSet${set}`;

    const protects = maps.filter(m => m.status === MapStatus.Protected);
    const bans = maps.filter(m => m.status === MapStatus.Banned);
    textBuilder += `\n${team1Name}`;
    textBuilder += `:shield: ${protects.filter((b: postResultsMap) => b.team === team1Name).map((b: postResultsMap) => b.name.split(" | ")[0]).join(" ")}`;
    textBuilder += `:no_entry_sign: ${bans.filter((b: postResultsMap) => b.team === team1Name).map((b: postResultsMap) => b.name.split(" | ")[0]).join(" ")}`;
    
    textBuilder += `\n${team2Name}`;
    textBuilder += `:shield: ${protects.filter((b: postResultsMap) => b.team === team2Name).map((b: postResultsMap) => b.name.split(" | ")[0]).join(" ")}`;
    textBuilder += `:no_entry_sign: ${bans.filter((b: postResultsMap) => b.team === team2Name).map((b: postResultsMap) => b.name.split(" | ")[0]).join(" ")}`;

    return textBuilder;
}
refereeMatchupsRouter.$post<{ message: string }>("/:tournamentID/:matchupID/postResults", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const body = ctx.request.body;
    if (typeof body.matchID !== "string") {
        ctx.body = {
            success: false,
            error: "Invalid match ID.",
        };
        return;
    }

    if (typeof body.stage !== "string") {
        ctx.body = {
            success: false,
            error: "Invalid stage.",
        };
        return;
    }

    if (typeof body.team1Score !== "number") {
        ctx.body = {
            success: false,
            error: "Invalid team 1 score.",
        };
        return;
    }

    if (typeof body.team2Score !== "number") {
        ctx.body = {
            success: false,
            error: "Invalid team 2 score.",
        };
        return;
    }

    if (typeof body.team1Name !== "string") {
        ctx.body = {
            success: false,
            error: "Invalid team 1 name.",
        };
        return;
    }

    if (typeof body.team2Name !== "string") {
        ctx.body = {
            success: false,
            error: "Invalid team 2 name.",
        };
        return;
    }

    if (body.forfeit !== undefined && typeof body.forfeit !== "boolean") {
        ctx.body = {
            success: false,
            error: "Invalid forfeit.",
        };
        return;
    }
    const forfeit: boolean = body.forfeit ?? false;

    if (typeof body.mpID !== "number" && !forfeit) {
        ctx.body = {
            success: false,
            error: "Invalid mp ID.",
        };
        return;
    }

    const sets: postResultsSet[] | undefined = body.sets;
    if (!sets && !forfeit) {
        ctx.body = {
            success: false,
            error: "Missing sets.",
        };
        return;
    }

    if (!Array.isArray(sets) || sets.some(s => typeof s.set !== "number" || !Array.isArray(s.maps))) {
        ctx.body = {
            success: false,
            error: "Invalid sets.",
        };
        return;
    }

    if (sets.some(set => set.maps.some((map: postResultsMap) => typeof map.name !== "string" || typeof map.status !== "number" || (map.team && typeof map.team !== "string")))) {
        ctx.body = {
            success: false,
            error: "Invalid maps.",
        };
        return;
    }

    const setsWithMaps = sets.filter(set => set.maps && set.maps.length > 0);
    if (setsWithMaps.length === 0 && !forfeit) {
        ctx.body = {
            success: false,
            error: "Missing sets.",
        };
        return;
    }

    const resultsChannel = await TournamentChannel
        .createQueryBuilder("channel")
        .innerJoin("channel.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .andWhere("channel.channelType = '11'")
        .getOne();
    if (!resultsChannel) {
        ctx.body = {
            success: false,
            error: "Results channel not found.",
        };
        return;
    }
    const channel = await discordClient.channels.fetch(resultsChannel.channelID);
    if (!channel?.isTextBased()) {
        ctx.body = {
            success: false,
            error: "Results channel not found.",
        };
        return;
    }

    let textBuilder = `**${body.stage}: ${body.matchID}**\n${body.team1Score > body.team2Score ? ":medal:**" : ""}${body.team1Name} | ${body.forfeit && body.team1Score === 0 ? "FF" : body.team1Score}${body.team1Score > body.team2Score ? "**" : ""} - ${body.team2Score > body.team1Score ? "**" : ""}${body.forfeit && body.team2Score === 0 ? "FF" : body.team2Score} | ${body.team2Name}${body.team2Score > body.team1Score ? "**:medal:" : ""}`;
    if (!forfeit) {
        textBuilder += `\n[MP Link](<https://osu.ppy.sh/community/matches/${body.mpID}>)`;

        for (const set of setsWithMaps) {
            if (setsWithMaps.length === 1)
                textBuilder += normalMatchText(body.team1Name, body.team2Name, set.maps);
            else
                textBuilder += setBasedMatchText(body.team1Name, body.team2Name, set.maps, set.set);
        }
    }

    await channel.send(textBuilder);

    ctx.body = {
        success: true,
        message: "name" in channel ? `Results posted to ${channel.name}.` : "Results posted.",
    };
});

export default refereeMatchupsRouter;
