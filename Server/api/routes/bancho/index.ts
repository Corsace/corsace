import { CorsaceRouter } from "../../../corsaceRouter";
import koaBasicAuth from "koa-basic-auth";
import runMatchup from "../../../../BanchoBot/functions/tournaments/matchup/runMatchup";
import { ParameterizedContext, Next } from "koa";
import { config } from "node-config-ts";
import { Matchup, preInviteTime } from "../../../../Models/tournaments/matchup";
import { TextChannel } from "discord.js";
import { discordClient } from "../../../discord";
import state from "../../../../BanchoBot/state";

async function validateData (ctx: ParameterizedContext, next: Next) {
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

banchoRouter.$post("/runQualifiers", validateData, async (ctx) => {
    ctx.body = {
        success: true,
    };

    // Get all qualifiers that are in the past and have not been played
    const matchups = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.streamer", "streamer")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.mappool", "mappool")
        .innerJoinAndSelect("mappool.slots", "slot")
        .innerJoinAndSelect("slot.maps", "map")
        .innerJoinAndSelect("map.beatmap", "beatmap")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .innerJoinAndSelect("tournament.organizer", "organizer")
        .leftJoinAndSelect("matchup.teams", "team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .where("matchup.date <= :now", { now: ctx.state.matchupDate })
        .andWhere("stage.stageType = '0'")
        .andWhere("matchup.mp IS NULL")
        .getMany();

    for (const matchup of matchups) {
        await runMatchup(matchup, false, true).catch(async err => {
            console.error(err);
            const channel = discordClient.channels.cache.get(config.discord.coreChannel);
            if (channel instanceof TextChannel)
                await channel.send(`Error running qualifier GHIVE THIS IMMEDIATE ATTENTION:\n\`\`\`\n${err}\n\`\`\``);
        });
    }
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