import multer from "@koa/multer";
import Router, { Middleware } from "@koa/router";
import { unlink } from "fs/promises";
import * as Jimp from "jimp";
import { config } from "node-config-ts";
import { nameFilter } from "../../../Interfaces/team";
import { Team } from "../../../Models/team";
import { discordGuild, getMember } from "../../../Server/discord";
import { hasNoTeam, isCaptain, isLoggedInDiscord, isRegistration, notOpenStaff } from "../../../Server/middleware";

const teamRouter = new Router();
const upload = multer({ 
    limits: { fileSize: 5 * 1024 * 1024 },
});

const teamPayloadValidation: Middleware = async (ctx, next) => {
    const data = ctx.request.body;

    if (!data.name)
        return ctx.body = { error: "Missing team name!" };

    if (data.name.length > 20 || data.name.length < 3)
        return ctx.body = { error: "Invalid team name!" }; 

    if (nameFilter.test(data.name))
        return ctx.body = { error: "Inappropriate team name!" };

    await next();
}

// Gets user's team
teamRouter.get("/", isLoggedInDiscord, async (ctx) => {
    const team = await Team.findOne({
        where: [
            {
                captain: ctx.state.user
            },
            {
                players: {
                    Any: ctx.state.user,
                }
            }
        ]
    });

    ctx.body = {
        team: team ?? null,
    };
});

// Gets all teams
teamRouter.get("/:id", async (ctx) => {
    if (!/\d+/.test(ctx.params.id))
        return ctx.body = { error: `${ctx.params.id} is an invalid ID` };
    const teams = await Team.findOne({
        where: {
            tournaments: {
                Any: ctx.params.id,
            },
        },
    });

    ctx.body = teams;
});

// Create team
teamRouter.post("/", isLoggedInDiscord, notOpenStaff, hasNoTeam, isRegistration, teamPayloadValidation, async (ctx) => {
    let name = ctx.request.body.name;
    if (/^team /i.test(name))
        name = name.replace(/^team /i, "");

    const slug = name.replace(/ /g, "-").toLowerCase();
    if (await Team.findOne({ slug })) {
        ctx.body = {
            error: `Team ${slug} already exists!`,
        }
        return;
    }

    const guild = await discordGuild();
    const team = new Team;

    team.name = name;
    team.slug = slug;
    team.captain = ctx.state.user;
    team.tournament = ctx.state.tournament;
    const role = await guild.roles.create({
        data: {
            name: `CO TEAM ${team.name}`,
            hoist: false,
            mentionable: false,
        },
        reason: `Team ${name} has been created by ${ctx.state.user.osu.username}`
    });
    team.role = role.id;
    await team.save();
    
    const member = await getMember(ctx.state.user.discord.userID);
    if (!member) {
        await guild.addMember(ctx.state.user.discord.userID, {
            accessToken: await ctx.state.user.getAccessToken("discord"),
            nick: ctx.state.user.osu.username,
            roles: [config.discord.roles.corsace.verified, config.discord.roles.open.participants, config.discord.roles.open.captains as string, team.role],
        });
    } else {
        await Promise.all([
            member.setNickname(ctx.state.user.osu.username),
            member.roles.add([config.discord.roles.corsace.verified, config.discord.roles.open.participants, config.discord.roles.open.captains as string, team.role]),
        ]);
    }
});

// Rename team
teamRouter.put("/rename", isLoggedInDiscord, isCaptain, teamPayloadValidation, async (ctx) => {
    let name = ctx.request.body.name;
    if (/^team /i.test(name))
        name = name.replace(/^team /i, "");

    const slug = name.replace(/ /g, "-").toLowerCase();
    if (await Team.findOne({ slug })) {
        ctx.body = {
            error: `Team ${slug} already exists!`,
        }
        return;
    }

    const guild = await discordGuild();
    const team: Team = ctx.state.team;
    const oldName = team.name;

    team.name = name;
    await team.save();

    await guild.roles.resolve(team.role)?.edit(
        { name: `CO TEAM ${team.name}` }, 
        `${ctx.state.user.osu.username} has changed their team name from ${oldName} to ${team.name}`,
    );
});

// Add avatar
teamRouter.post("/avatar", isLoggedInDiscord, isCaptain, upload.single("avatar"), async (ctx) => {
    if(!ctx.request.file) {
        ctx.body = { error: "No avatar file found" };
        return;
    }
    const team: Team = ctx.state.team;
    const image = await Jimp.read(ctx.request.file.buffer);
    let size = Math.min(image.bitmap.height, image.bitmap.width);
    if(size > 256)
        size = 256;
    const filePath = "/teamAvatars/" + team.slug + ".png";
    image.contain(size, size)
        .deflateLevel(3)
        .quality(60);

    if(team.avatar && team.avatar.indexOf(config.corsace.publicUrl) === 0) { // Current avatar is already one from the website. We need to remove it before writing over.
        const oldUrl = new URL(team.avatar);
        await unlink("./data" + oldUrl);
    }

    await new Promise((res, rej) => image.write("./data" + filePath, (err, img) => {
        if (err)
            rej(err);
        res(img);
    }));
    
    team.avatar = `${config.corsace.publicUrl}${filePath}?${Date.now()}`;
    await team.save();
    ctx.body = { team };
});

export default teamRouter;
