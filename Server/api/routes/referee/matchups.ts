import { CorsaceRouter } from "../../../corsaceRouter";
import { TournamentRoleType, unallowedToPlay } from "../../../../Interfaces/tournament";
import { MapStatus, Matchup as MatchupInterface } from "../../../../Interfaces/matchup";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Stage } from "../../../../Models/tournaments/stage";
import { Round } from "../../../../Models/tournaments/round";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { discordClient } from "../../../discord";
import { isLoggedInDiscord } from "../../../middleware";
import { hasRoles, validateTournament } from "../../../middleware/tournament";
import { parseQueryParam } from "../../../utils/query";
import dbMatchupToInterface from "../../../functions/tournaments/matchups/dbMatchupToInterface";
import { TournamentAuthenticatedState } from "koa";
import { TournamentChannel } from "../../../../Models/tournaments/tournamentChannel";

const refereeMatchupsRouter  = new CorsaceRouter<TournamentAuthenticatedState>();

//TODO: Look into making refereeRouter.use work for the middleware functions
refereeMatchupsRouter.$use(isLoggedInDiscord);
refereeMatchupsRouter.$use("/:tournamentID", validateTournament, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]));

refereeMatchupsRouter.$get<{ matchups: MatchupInterface[] }>("/:tournamentID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchupQ = Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.round", "round")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team1.captain", "captain1")
        .leftJoinAndSelect("team2.captain", "captain2")
        .leftJoinAndSelect("team1.members", "members1")
        .leftJoinAndSelect("team2.members", "members2")
        .leftJoinAndSelect("matchup.winner", "winner")
        .leftJoinAndSelect("matchup.potentialFor", "potentialFor")
        .leftJoin("matchup.referee", "referee")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .andWhere("matchup.potentialFor IS NULL");

    // For organizers to see all matchups
    const roles = await TournamentRole
        .createQueryBuilder("role")
        .innerJoin("role.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .getMany();
    let bypass = false;
    if (roles.length > 0) {
        try {
            const organizerRoles = roles.filter(r => r.roleType === TournamentRoleType.Organizer);
            const tournamentServer = await discordClient.guilds.fetch(ctx.state.tournament.server);
            const discordMember = await tournamentServer.members.fetch(ctx.state.user.discord.userID);
            bypass = organizerRoles.some(r => discordMember.roles.cache.has(r.roleID));
        } catch (e) {
            bypass = false;
        }
    }

    if (!bypass)
        matchupQ
            .andWhere("referee.ID = :refereeID", { refereeID: ctx.state.user.ID });
        
    const skip = parseInt(parseQueryParam(ctx.query.skip) ?? "") || 0;
    const matchups = await matchupQ
        .skip(skip)
        .take(5)
        .orderBy("stage.timespan.start", "DESC")
        .addOrderBy("matchup.date", "ASC")
        .getMany();

    ctx.body = {
        success: true,
        matchups: await Promise.all(matchups.map(async m => await dbMatchupToInterface(m, null))),
    };
});

refereeMatchupsRouter.$get<{ matchup: MatchupInterface }>("/:tournamentID/:matchupID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchupQ = Matchup
        .createQueryBuilder("matchup")
        // round and stage
        .leftJoinAndSelect("matchup.round", "round")
        .innerJoinAndSelect("matchup.stage", "stage")
        // tournament
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.referee", "referee")
        // teams
        .leftJoinAndSelect("matchup.teams", "teams")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("teams.captain", "captain")
        .leftJoinAndSelect("team1.captain", "captain1")
        .leftJoinAndSelect("team2.captain", "captain2")
        .leftJoinAndSelect("teams.members", "members")
        .leftJoinAndSelect("team1.members", "members1")
        .leftJoinAndSelect("team2.members", "members2")
        .leftJoinAndSelect("matchup.winner", "winner")
        // maps
        .leftJoinAndSelect("matchup.sets", "set")
        .leftJoinAndSelect("set.first", "first")
        .leftJoinAndSelect("set.maps", "maps")
        .leftJoinAndSelect("maps.map", "map")
        .leftJoinAndSelect("map.slot", "slot")
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID });

    // TODO: Add x amount of latest messages to the query, and support scrolling pagination on ref page and matchup page

    // For organizers to see all matchups
    const roles = await TournamentRole
        .createQueryBuilder("role")
        .innerJoin("role.tournament", "tournament")
        .where("tournament.ID = :ID", { ID: ctx.state.tournament.ID })
        .getMany();
    let bypass = false;
    if (roles.length > 0) {
        try {
            const privilegedRoles = roles.filter(r => unallowedToPlay.some(u => u === r.roleType));
            const tournamentServer = await discordClient.guilds.fetch(ctx.state.tournament.server);
            const discordMember = await tournamentServer.members.fetch(ctx.state.user.discord.userID);
            bypass = privilegedRoles.some(r => discordMember.roles.cache.has(r.roleID));
        } catch (e) {
            bypass = false;
        }
    }

    if (!bypass)
        matchupQ
            .andWhere("referee.ID = :refereeID", { refereeID: ctx.state.user.ID });
        
    const dbMatchup = await matchupQ.getOne();

    if (!dbMatchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found.",
        };
        return;
    }

    const roundOrStage: Round | Stage | null = 
        dbMatchup.round ? 
            await Round
                .createQueryBuilder("round")
                .innerJoin("round.matchups", "matchup")
                .leftJoinAndSelect("round.mappool", "mappool")
                .leftJoinAndSelect("mappool.slots", "slots")
                .leftJoinAndSelect("slots.maps", ",mps")
                .leftJoinAndSelect("maps.beatmap", "map")
                .leftJoinAndSelect("map.beatmapset", "beatmapset")
                .leftJoinAndSelect("round.mapOrder", "mapOrder")
                .where("matchup.ID = :ID", { ID: dbMatchup.ID })
                .getOne() :
            dbMatchup.stage ?
                await Stage
                    .createQueryBuilder("stage")
                    .innerJoin("stage.matchups", "matchup")
                    .leftJoinAndSelect("stage.mappool", "mappool")
                    .leftJoinAndSelect("mappool.slots", "slots")
                    .leftJoinAndSelect("slots.maps", "maps")
                    .leftJoinAndSelect("maps.beatmap", "map")
                    .leftJoinAndSelect("map.beatmapset", "beatmapset")
                    .leftJoinAndSelect("stage.mapOrder", "mapOrder")
                    .where("matchup.ID = :ID", { ID: dbMatchup.ID })
                    .getOne() : 
                null;
    
    ctx.body = {
        success: true,
        matchup: await dbMatchupToInterface(dbMatchup, roundOrStage),
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
    if (protects) {
        textBuilder += "\n\n__**Protects**__";
        textBuilder += `\n**${team1Name}**\n`;
        textBuilder += protects.filter((b: postResultsMap) => b.team === team1Name).map((b: postResultsMap) => `\`${b.name}\``).join("\n");
        textBuilder += "\n";
        textBuilder += `\n**${team2Name}**\n`;
        textBuilder += protects.filter((b: postResultsMap) => b.team === team2Name).map((b: postResultsMap) => `\`${b.name}\``).join("\n");
    }

    const bans = maps.filter(m => m.status === MapStatus.Banned);
    if (bans) {
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
    textBuilder += `�${protects.filter((b: postResultsMap) => b.team === team1Name).map((b: postResultsMap) => b.name.split(" | ")[0])}`;
    textBuilder += `�${bans.filter((b: postResultsMap) => b.team === team1Name).map((b: postResultsMap) => b.name.split(" | ")[0])}`;
    
    textBuilder += `\n${team2Name}`;
    textBuilder += `�${protects.filter((b: postResultsMap) => b.team === team2Name).map((b: postResultsMap) => b.name.split(" | ")[0])}`;
    textBuilder += `�${bans.filter((b: postResultsMap) => b.team === team2Name).map((b: postResultsMap) => b.name.split(" | ")[0])}`;

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

    let textBuilder = `**${body.stage}: ${body.matchID}**\n${body.team1Score > body.team2Score ? "�**" : ""}${body.team1Name} | ${body.forfeit && body.team1Score === 0 ? "FF" : body.team1Score}${body.team1Score > body.team2Score ? "**" : ""} - ${body.team2Score > body.team1Score ? "**" : ""}${body.forfeit && body.team2Score === 0 ? "FF" : body.team2Score} | ${body.team2Name}${body.team2Score > body.team1Score ? "**�" : ""}`;
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
