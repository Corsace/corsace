import Router from "@koa/router";
import { createHmac, timingSafeEqual } from "crypto";
import { config } from "node-config-ts";
import Axios from "axios";

const githubRouter = new Router();

githubRouter.post("/", async (ctx) => {
    const signature = createHmac("sha256", config.github.webhookSecret)
        .update(JSON.stringify(ctx.request.body))
        .digest("hex");
    const trusted = Buffer.from(`sha256=${signature}`).toString("base64");
    const received = Buffer.from(ctx.get("x-hub-signature-256")).toString("base64");
    if (!timingSafeEqual(Buffer.from(trusted), Buffer.from(received))) {
        ctx.status = 403;
        return;
    }

    // For pushes, github checks/actions, and pull requests, we only want to trigger the webhook if the branch is not ignored 
    const body = ctx.request.body;
    const ref = 
        body.ref?.split("/")?.pop() || 
        body.pull_request?.head?.ref ||
        body.check_run?.check_suite?.head_branch || 
        body.check_run?.check_suite?.pull_requests?.[0]?.head?.ref ||
        body.check_run?.pull_requests?.[0]?.head?.ref ||
        body.workflow_job?.head_branch ||
        body.workflow_run?.head_branch ||
        body.workflow_run?.pull_requests?.[0]?.head?.ref ||
        body.workflow_run?.check_suite?.head_branch;
    if (ref && config.github.ignoredBranches?.includes(ref)) {
        ctx.status = 200;
        return;
    }

    try {
        const res = await Axios.post(`${config.github.webhookURL}/github`, ctx.request.body);
        ctx.status = res.status;
        ctx.body = res.data;
    } catch (e) {
        ctx.status = 500;
        ctx.body = "Internal server error";
        console.error(e);
    }
});

export default githubRouter;
