import { CorsaceRouter } from "../../corsaceRouter";
import koaIp from "koa-ip";
import { config } from "node-config-ts";
import { StageType } from "../../../Interfaces/stage";
import { unallowedToPlay } from "../../../Interfaces/tournament";
import { Matchup } from "../../../Models/tournaments/matchup";
import { TournamentRole } from "../../../Models/tournaments/tournamentRole";
import { User } from "../../../Models/user";
import { discordClient } from "../../discord";

const centrifugoRouter  = new CorsaceRouter();

const ipWhitelist = koaIp(config.centrifugo.ipWhitelist);

interface ConnectResponse {
    result: {
        user: string;
        expire_at?: number;
    };
}

interface SubscribeRequest {
    client: string;
    transport: string;
    protocol: string;
    encoding: string;
    user: string;
    channel: string;
    meta?: any;
    data?: any;
    b64data?: string;
}

const channelTypes = [ "matchup" ];

async function getChannel (channelType: string, channelID: number): Promise<any> {
    if (!channelTypes.includes(channelType))
        return null;

    if (channelType === "matchup") {
        return Matchup
            .createQueryBuilder("matchup")
            .leftJoinAndSelect("matchup.stage", "stage")
            .leftJoinAndSelect("stage.tournament", "tournament")
            .where("matchup.ID = :id", { id: channelID })
            .getOne();
    }

    return `${channelType}:${channelID}`;
}

centrifugoRouter.get("/publicUrl", (ctx) => {
    ctx.body = {
        success: true,
        url: config.centrifugo.publicUrl,
    };
});

centrifugoRouter.post("/connect", ipWhitelist, (ctx) => {
    if (ctx.state?.user?.ID) {
        ctx.body = {
            result: {
                user: `${ctx.state.user.ID}`,
                // Use undocumented koa session trick. If unavailable, set a 1hr expire time.
                expire_at: ctx.session?._expire ? Math.ceil(ctx.session?._expire) : Math.ceil(Date.now() / 1000) + 60 * 60,
            },
        } as ConnectResponse;
    } else {
        // Allow anonymous connections
        ctx.body = {
            result: {
                user: "",
            },
        } as ConnectResponse;
    }
});

centrifugoRouter.post("/subscribe", ipWhitelist, async (ctx) => {
    const body = ctx.request.body as SubscribeRequest;
    const channelName = body.channel;
    if (!channelName.includes(":") || channelName.split(":").length !== 2 || isNaN(parseInt(channelName.split(":")[1]))) {
        ctx.body = {
            error: {
                code: 102,
                message: "unknown channel",
            },
        };
        return;
    }
    const channelType = channelName.split(":")[0];
    const channelID = parseInt(channelName.split(":")[1]);

    const channel = await getChannel(channelType, channelID);
    if (!channel) {
        ctx.body = {
            error: {
                code: 102,
                message: "unknown channel",
            },
        };
        return;
    }

    if (channel instanceof Matchup && channel.stage?.stageType === StageType.Qualifiers && !channel.stage.publicScores) {
        let authorized = false;
        const user = body.user ? await User.findOne({ where: { ID: Number(body.user) } }) : null;
        if (user?.discord?.userID) {
            const roles = await TournamentRole
                .createQueryBuilder("role")
                .leftJoinAndSelect("role.tournament", "tournament")
                .where("tournament.ID = :tournamentID", { tournamentID: channel.stage.tournament.ID })
                .getMany();
            if (roles.length > 0) {
                try {
                    const privilegedRoles = roles.filter(r => unallowedToPlay.some(u => u === r.roleType));
                    const tournamentServer = await discordClient.guilds.fetch(channel.stage.tournament.server);
                    const discordMember = await tournamentServer.members.fetch(user.discord.userID);
                    authorized = privilegedRoles.some(r => discordMember.roles.cache.has(r.roleID));
                } catch (e) {
                    authorized = false;
                }
            }
        }
        if (!authorized) {
            ctx.body = {
                error: {
                    code: 103,
                    message: "permission denied",
                },
            };
            return;
        }
    }

    ctx.body = {
        result: {},
    };
});

export default centrifugoRouter;
