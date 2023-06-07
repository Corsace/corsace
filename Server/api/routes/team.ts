import Router from "@koa/router";
import { ParameterizedContext, Next } from "koa";
import { isLoggedInDiscord } from "../../middleware";
import { Team } from "../../../Models/tournaments/team";
import { profanityFilterStrong } from "../../../Interfaces/comment";
import Jimp from "jimp";
import { promises } from "fs";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";
import { User } from "../../../Models/user";
import { TeamInvite } from "../../../Models/tournaments/teamInvite";

function validateTeam (isManager?: boolean) {
    return async function (ctx: ParameterizedContext, next: Next) {
        const ID = ctx.request.body?.ID || ctx.params.teamID || ctx.query.ID || ctx.query.teamID;

        if (ID === undefined || isNaN(parseInt(ID)) || parseInt(ID) < 1) {
            ctx.body = {
                success: false,
                error: "Missing ID",
            };
            return;
        }

        const team = await Team
            .createQueryBuilder("team")
            .leftJoinAndSelect("team.manager", "manager")
            .leftJoinAndSelect("team.members", "member")
            .leftJoinAndSelect("team.invites", "invite")
            .where("team.ID = :ID", { ID })
            .getOne();

        if (!team) {
            ctx.body = {
                success: false,
                error: "Team not found",
            };
            return;
        }

        if (isManager && team.manager.ID !== ctx.state.user.ID) {
            ctx.body = {
                success: false,
                error: "You are not the manager of this team",
            };
            return;
        }
        if (!isManager && !team.members.find(member => member.ID === ctx.state.user.ID)) {
            ctx.body = {
                success: false,
                error: "You are not a member of this team",
            };
            return;
        }

        ctx.state.team = team;

        await next();
    };
}

const teamRouter = new Router();

teamRouter.get("/", isLoggedInDiscord, async (ctx) => {
    const teams = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("team.manager", "manager")
        .where("manager.discordUserID = :discordUserID", { discordUserID: ctx.state.user.discord.userID })
        .orWhere("member.discordUserID = :discordUserID", { discordUserID: ctx.state.user.discord.userID })
        .getMany();
    
    ctx.body = teams.map(team => {
        return {
            ID: team.ID,
            name: team.name,
            abbreviation: team.abbreviation,
            manager: `${team.manager.osu.username} (${team.manager.osu.userID})`,
            members: team.members.map(member => `${member.osu.username} (${member.osu.userID})`),
        };
    });
});

teamRouter.post("/create", isLoggedInDiscord, async (ctx) => {
    let { name, abbreviation } = ctx.request.body;

    if (!name || !abbreviation) {
        ctx.body = { error: "Missing parameters" };
        return;
    }

    if (/^team /i.test(name)) {
        name = name.replace(/^team /i, "");
        if (/^t/i.test(abbreviation))
            abbreviation = abbreviation.replace(/^t/i, "");
    }

    if (name.length > 20 || name.length < 3 || profanityFilterStrong.test(name)) {
        ctx.body = { error: "Invalid name" };
        return;
    }

    if (abbreviation.length > 4 || abbreviation.length < 2 || profanityFilterStrong.test(abbreviation)) {
        ctx.body = { error: "Invalid abbreviation" };
        return;
    }

    const team = new Team;
    team.name = name;
    team.abbreviation = abbreviation;
    team.manager = ctx.state.user;
    if (ctx.body.isPlaying)
        team.members = [ctx.state.user];

    await team.calculateBWS();

    ctx.body = { success: "Team created", team };
});

teamRouter.post("/:teamID/avatar", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    // Get the file from the request
    const files = ctx.request.files?.avatar;
    if (!files) {
        ctx.body = { error: "Missing avatar" };
        return;
    }
    
    // if files is an array, get the first 
    const file = Array.isArray(files) ? files[0] : files;
    
    // Check if the file is an image
    if (!file.mimetype?.startsWith("image/")) {
        ctx.body = { error: "Invalid file type" };
        return;
    }

    // Make the file size 256x256
    const image = await Jimp.read(file.filepath);
    const size = Math.min(Math.min(image.getWidth(), image.getHeight()), 256);
    image
        .contain(size, size)
        .deflateLevel(3)
        .quality(75);

    // Remove previous avatar if it exists
    if (team.avatarURL) {
        try {
            await promises.unlink(team.avatarURL);
        } catch (err) {
            ctx.body = { error: "Failed to remove previous avatar\n" + err };
            return;
        }
    }

    // Save the image
    const avatarPath = `./public/avatars/${team.ID}.png?${Date.now()}`;
    await image.writeAsync(avatarPath);

    // Update the team
    team.avatarURL = avatarPath;
    await team.save();

    ctx.body = { success: "Avatar updated", avatar: avatarPath };
});

teamRouter.post("/:teamID/register", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    const tournamentID = ctx.request.body?.tournamentID;
    if (!tournamentID) {
        ctx.body = { error: "Missing tournament ID" };
        return;
    }

    const tournament = await Tournament
        .createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.teams", "team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .where("tournament.ID = :ID", { ID: tournamentID })
        .getOne();
    
    if (!tournament) {
        ctx.body = { error: "Tournament not found" };
        return;
    }

    if (tournament.status !== TournamentStatus.Registrations) {
        ctx.body = { error: "Tournament is not in registration phase" };
        return;
    }

    if (tournament.teams.find(t => t.ID === team.ID)) {
        ctx.body = { error: "Team already registered" };
        return;
    }

    const tournamentMembers = tournament.teams.flatMap(t => [t.manager,...t.members]);
    const teamMembers = [team.manager, ...team.members];
    const alreadyRegistered = teamMembers.filter(member => tournamentMembers.some(m => m.ID === member.ID));
    if (alreadyRegistered.length > 0) {
        ctx.body = { error: `Some members are already registered in this tournament`, members: alreadyRegistered.map(m => m.osu.username) };
        return;
    }

    tournament.teams.push(team);
    await tournament.save();

    ctx.body = { success: "Team registered" };
});

teamRouter.post("/:teamID/invite", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;

    const userID = ctx.request.body?.userID;
    const idType = ctx.request.body?.idType;
    if (!userID) {
        ctx.body = { error: "Missing user ID" };
        return;
    }
    if (!idType) {
        ctx.body = { error: "Missing ID type" };
        return;
    }

    let user: User | null = null;
    if (idType === "osu")
        user = await User.findOne({ where: { osu: { userID } } });
    else if (idType === "discord")
        user = await User.findOne({ where: { discord: { userID } } });
    else if (idType === "corsace")
        user = await User.findOne({ where: { ID: userID } });
    else {
        ctx.body = { error: "Invalid ID type" };
        return;
    }

    if (!user) {
        ctx.body = { error: "User not found" };
        return;
    }

    if (team.members.some(m => m.ID === user?.ID) || team.manager.ID === user?.ID) {
        ctx.body = { error: "User is already in the team" };
        return;
    }

    if (team.invites?.some(i => i.ID === user?.ID)) {
        ctx.body = { error: "User is already invited" };
        return;
    }

    const invite = new TeamInvite;
    invite.team = team;
    invite.user = user;
    await invite.save();

    ctx.body = { success: "User invited", invite };
});

teamRouter.patch("/:teamID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    const team: Team = ctx.state.team;
    const body: Partial<Team> = ctx.request.body;

    if (body.name)
        team.name = body.name;
    if (body.abbreviation)
        team.abbreviation = body.abbreviation;
    
    await team.save();

    ctx.body = { success: "Team updated", name: team.name, abbreviation: team.abbreviation };
});
          
teamRouter.delete("/:teamID", isLoggedInDiscord, validateTeam(true), async (ctx) => {
    await ctx.state.team.remove();

    ctx.body = { success: "Team deleted" };
});



export default teamRouter;