import Router from "@koa/router";
import koaBasicAuth from "koa-basic-auth";
import runMatchup from "../../../../BanchoBot/functions/tournaments/matchup/runMatchup";
import { ParameterizedContext, Next } from "koa";
import { config } from "node-config-ts";
import { Matchup, preInviteTime } from "../../../../Models/tournaments/matchup";
import { TextChannel } from "discord.js";
import { discordClient } from "../../../discord";

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

const banchoRouter = new Router();

banchoRouter.use(koaBasicAuth({
    name: config.interOpAuth.username,
    pass: config.interOpAuth.password,
}));

banchoRouter.post("/runMatchups", validateData, async (ctx) => {
    ctx.body = {
        success: true,
    };

    // Get all matchups that are in the past and have not been played
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
        await runMatchup(matchup).catch(err => {
            console.error(err);
            const channel = discordClient.channels.cache.get(config.discord.coreChannel);
            if (channel instanceof TextChannel)
                channel.send(`Error running match GHIVE THIS IMMEDIATE ATTENTION:\n\`\`\`\n${err}\n\`\`\``);
        });
    }
});

export default banchoRouter;