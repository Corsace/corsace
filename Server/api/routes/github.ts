import { CorsaceRouter } from "../../corsaceRouter";
import { createHmac, timingSafeEqual } from "crypto";
import { config } from "node-config-ts";
import { post } from "../../utils/fetch";

// List of allowed events as per https://discord.com/developers/docs/resources/webhook#execute-githubcompatible-webhook
const ALLOWED_EVENTS = ["commit_comment", "create", "delete", "fork", "issue_comment", "issues", "member", "public", "pull_request", "pull_request_review", "pull_request_review_comment", "push", "release", "watch", "check_run", "check_suite", "discussion", "discussion_comment"];

const githubRouter  = new CorsaceRouter();

// any is used here to send the discord github webhook data back to github as a response
githubRouter.$post<any>("/", async (ctx) => {
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
        body.check_suite?.head_branch ||
        body.check_suite?.pull_requests?.[0]?.head?.ref ||
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

    // Check if the event is allowed
    if (!ALLOWED_EVENTS.includes(ctx.get("X-GitHub-Event").toLowerCase())) {
        ctx.status = 200;
        return;
    }

    try {
        const res = await post<any>(`${config.github.webhookUrl}/github`, ctx.request.body, {
            headers: {
                "Content-Type": "application/json",
                "User-Agent": ctx.get("User-Agent"),
                "X-GitHub-Delivery": ctx.get("X-GitHub-Delivery"),
                "X-GitHub-Event": ctx.get("X-GitHub-Event"),
                "X-GitHub-Hook-ID": ctx.get("X-GitHub-Hook-ID"),
                "X-GitHub-Hook-Installation-Target-ID": ctx.get("X-GitHub-Hook-Installation-Target-ID"),
                "X-GitHub-Hook-Installation-Target-Type": ctx.get("X-GitHub-Hook-Installation-Target-Type"),
            },
        }, true);
        if (!res.success)
            throw typeof res.error === "string" ? new Error(res.error) : res.error;

        ctx.status = 200;
        ctx.body = res;
    } catch (e) {
        ctx.status = 500;
        ctx.body = {
            success: false,
            error: "Internal server error",
        };
        console.error(e);
    }
});

export default githubRouter;
