import multer from "@koa/multer";
import Router, { Middleware } from "@koa/router";
import { unlink } from "fs/promises";
import * as Jimp from "jimp";
import { config } from "node-config-ts";
import { nameFilter } from "../../../Interfaces/team";
import { Team } from "../../../Models/team";
import { TeamInvitation } from "../../../Models/teamInvitation";
import { User } from "../../../Models/user";
import { discordGuild, getMember } from "../../../Server/discord";
import { hasNoTeam, hasTeam, isCaptain, isHeadStaff, isLoggedInDiscord, isRegistration, notOpenStaff } from "../../../Server/middleware";

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
teamRouter.get("/", async (ctx) => {
    let team: Team | undefined;
    if (ctx.query.name)
        team = await Team.findOne({ name: ctx.query.name });
    else if (ctx.query.slug)
        team = await Team.findOne({ slug: ctx.query.slug });
    else
        team = await Team.findOne({
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

// Search for a team
teamRouter.get("/search", async (ctx) => {

});

// Get pending invitations for team
teamRouter.get("/pendingInvitations", hasTeam, async (ctx) => {

});

// Gets all teams
teamRouter.get("/:id", async (ctx) => {
    if (!/\d+/.test(ctx.params.id))
        return ctx.body = { error: `${ctx.params.id} is an invalid ID` };
    const teams = await Team.findOne({
        tournament: ctx.params.id,
    });

    ctx.body = teams;
});

// Captain endpoints

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

// Invite player to team
teamRouter.post("/invite", isLoggedInDiscord, isCaptain, isRegistration, async (ctx) => {

});

// Cancel player invitation to team
teamRouter.put("/cancel", isLoggedInDiscord, isCaptain, async (ctx) => {

});

// Kick player from team
teamRouter.post("/kick", isLoggedInDiscord, isCaptain, isRegistration, async (ctx) => {

});

// Let another user be captain for the team
teamRouter.put("/transferCaptain", isLoggedInDiscord, isCaptain, async (ctx) => {
    const data = ctx.request.body;
    if (!data.target)
        return ctx.body = { error: "No target user provided!" };
    
    const target = await User.findOne(data.target);
    if (!target)
        return ctx.body = { error: "Invalid target user ID provided!" };
    const user: User = ctx.state.user;
    
    target.teamCaptain = target.team;
    user.team = user.teamCaptain;

    target.team = user.teamCaptain = undefined;

    await Promise.all([target.save(), user.save()]);

    const guild = await discordGuild();
    const team: Team = ctx.state.team;
    const targetDiscord = await getMember(target.discord.userID);
    if (!targetDiscord)
        await guild.addMember(target.discord.userID, {
            accessToken: await target.getAccessToken("discord"),
            nick: target.osu.username,
            roles: [config.discord.roles.corsace.verified, config.discord.roles.open.participants, config.discord.roles.open.captains as string, team.role],
        });
    else
        await targetDiscord.roles.add(config.discord.roles.open.captains as string);
    const userDiscord = await getMember(user.discord.userID);
    if (!userDiscord)
        await guild.addMember(user.discord.userID, {
            accessToken: await user.getAccessToken("discord"),
            nick: user.osu.username,
            roles: [config.discord.roles.corsace.verified, config.discord.roles.open.participants, team.role],
        });
    else
        await userDiscord.roles.remove(config.discord.roles.open.captains as string);

    ctx.body = { status: "Success" };
});

// Delete team
teamRouter.delete("/delete", isLoggedInDiscord, isCaptain, isRegistration, async (ctx) => {
    const invites = await TeamInvitation.find({
        team: ctx.state.team,
    });
    await Promise.all(invites.map(inv => inv.remove()));

    const guild = await discordGuild();
    const team: Team = ctx.state.team;

    await guild.roles.resolve(team.role)?.delete(`${ctx.state.user.osu.username} has deleted team ${team.name}`);
    await team.remove();
    
    ctx.body = { status: "Success" };
});

// Endpoints for headstaff to do any changes as necessary

// Force add user to team
teamRouter.get("/add", isHeadStaff, async (ctx) => {

});

// Force remove user from team
teamRouter.get("/remove", isHeadStaff, async (ctx) => {

});

// Swap 2 users, between teams if both have teams, otherwise removing team from one and adding it to another
teamRouter.get("/swap", isHeadStaff, async (ctx) => {

});

// Force delete team
teamRouter.get("/purge", isHeadStaff, async (ctx) => {

});

export default teamRouter;
