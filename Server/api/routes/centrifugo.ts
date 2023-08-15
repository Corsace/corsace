import Router from "@koa/router";
import koaIp from "koa-ip";
import { config } from "node-config-ts";
import { User } from "../../../Models/user";

const centrifugoRouter = new Router();

centrifugoRouter.use(koaIp(config.centrifugo.ipWhitelist));

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

function getChannel (channelType: string, channelID: number) {
    console.log(channelType, channelID);
}           

centrifugoRouter.post("/connect", async (ctx) => {
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

centrifugoRouter.post("/subscribe", async (ctx) => {
    const body = ctx.request.body as SubscribeRequest;
    const channelName = body.channel;
    if (!channelName.includes("-") || channelName.split("-").length !== 2 || isNaN(parseInt(channelName.split("-")[1]))) {
        ctx.body = {
            error: {
                code: 102,
                message: "unknown channel",
            },
        };
        return;
    }
    const channelType = channelName.split("-")[0];
    const channelID = parseInt(channelName.split("-")[1]);

    const authorized = true; // TODO: implement subscription auth logic

    const channel = getChannel(channelType, channelID);

    const user = body.user ? await User.findOne({ where: { ID: Number(body.user) } }) : null;

    if (authorized) {
        ctx.body = {
            result: {},
        };
    } else {
        ctx.body = {
            error: {
                code: 103,
                message: "permission denied",
            },
        };
    }
});

export default centrifugoRouter;
