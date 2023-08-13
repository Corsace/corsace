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
    const user = body.user ? await User.findOne({ where: { ID: Number(body.user) } }) : null;

    const authorized = true; // TODO: implement subscription auth logic

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
