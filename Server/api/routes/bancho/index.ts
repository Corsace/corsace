import { CorsaceContext, CorsaceRouter } from "../../../corsaceRouter";
import koaBasicAuth from "koa-basic-auth";
import runMatchup from "../../../../BanchoBot/functions/tournaments/matchup/runMatchup";
import { Next } from "koa";
import { config } from "node-config-ts";
import { Matchup, preInviteTime } from "../../../../Models/tournaments/matchup";
import { TextChannel } from "discord.js";
import { discordClient } from "../../../discord";
import state from "../../../../BanchoBot/state";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { Team } from "../../../../Models/tournaments/team";
import { queue } from "async";

async function validateData (ctx: CorsaceContext<object>, next: Next) {
    const body = ctx.request.body;

    if (body.time === undefined) {
        ctx.body = {
            success: false,
            error: "Missing data",
        };
        return;
    }

    const time: number = body.time;

    const targetTime = new Date(time + preInviteTime);
    if (isNaN(targetTime.getTime()) || targetTime.getTime() < Date.now()) {
        ctx.body = {
            success: false,
            error: "Invalid time",
        };
        return;
    }

    ctx.state.matchupDate = targetTime;

    await next();
}

const banchoRouter  = new CorsaceRouter();

banchoRouter.$use(koaBasicAuth({
    name: config.interOpAuth.username,
    pass: config.interOpAuth.password,
}));

const runQualifiersQueue = queue(async (job: { matchupDate: Date }, cb) => {
    try {
        // Get all qualifiers that are in the past and have not been played
        const matchupsQ: (Omit<Matchup, "teams"> & { teams: number[] })[] = await Matchup
            .createQueryBuilder("matchup")
            .leftJoinAndSelect("matchup.referee", "referee")
            .leftJoinAndSelect("matchup.streamer", "streamer")
            .innerJoinAndSelect("matchup.stage", "stage")
            .innerJoinAndSelect("stage.tournament", "tournament")
            .innerJoinAndSelect("tournament.organizer", "organizer")
            .where("matchup.date <= :now", { now: job.matchupDate })
            .andWhere("stage.stageType = '0'")
            .andWhere("matchup.mp IS NULL")
            .loadAllRelationIds({
                relations: ["teams"],
            })
            .getMany() as any;

        const baseMatchups = await Matchup
            .createQueryBuilder("matchup")
            .where("matchup.ID IN (:...matchupIds)", { matchupIds: matchupsQ.map(m => m.ID) })
            .getMany();

        const matchups: Matchup[] = await Promise.all(baseMatchups.map(async baseMatchup => {
            const matchupQ = matchupsQ.find(m => m.ID === baseMatchup.ID)!;
            baseMatchup.referee = matchupQ.referee;
            baseMatchup.streamer = matchupQ.streamer;
            baseMatchup.stage = matchupQ.stage;

            const mappools = await Mappool
                .createQueryBuilder("mappool")
                .innerJoinAndSelect("mappool.slots", "slot")
                .innerJoinAndSelect("slot.maps", "map")
                .innerJoinAndSelect("map.beatmap", "beatmap")
                .where("mappool.stageID = :stageID", { stageID: matchupQ.stage!.ID })
                .getMany();
            baseMatchup.stage!.mappool = mappools;

            const teams = matchupQ.teams.length === 0 ? [] : await Team
                .createQueryBuilder("team")
                .innerJoinAndSelect("team.members", "members")
                .innerJoinAndSelect("team.captain", "captain")
                .where("team.ID IN (:...teamIds)", { teamIds: matchupQ.teams })
                .getMany();
            baseMatchup.teams = teams;

            return baseMatchup;
        }));

        for (const matchup of matchups) {
            await runMatchup(matchup, false, true).catch(async err => {
                console.error("An error occured while running runMatchup", err);
                const channel = discordClient.channels.cache.get(config.discord.coreChannel);
                if (channel instanceof TextChannel)
                    await channel.send(`Error running qualifier GHIVE THIS IMMEDIATE ATTENTION:\n\`\`\`\n${err}\n\`\`\``);
                throw err;
            });
        }
        cb();
    } catch(err) {
        cb(err as Error);
    }
}, 1);

banchoRouter.$post("/runQualifiers", validateData, async (ctx) => {
    try {
        await runQualifiersQueue.push({ matchupDate: ctx.state.matchupDate! });
    } catch (err) {
        console.error("An error occured while running runQualifiers", err);
    }

    ctx.body = {
        success: true,
    };
});

banchoRouter.$post("/stopAutoLobby", (ctx) => {
    const matchupID = ctx.request.body.matchupID;
    if (!matchupID || typeof matchupID !== "number" || isNaN(matchupID)) {
        ctx.body = {
            success: false,
            error: "Missing matchupID",
        };
        return;
    }

    if (!state.matchups[matchupID]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    state.matchups[matchupID].autoRunning = false;

    ctx.body = {
        success: true,
    };
});

export default banchoRouter;
