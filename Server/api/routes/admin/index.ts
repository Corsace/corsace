import { CorsaceRouter } from "../../../corsaceRouter";
import { cache } from "../../../../Server/cache";
import { isCorsace, isLoggedInDiscord } from "../../../../Server/middleware";

const adminRouter  = new CorsaceRouter();

adminRouter.$use(isLoggedInDiscord);
adminRouter.$use(isCorsace);

adminRouter.$get("/reset", (ctx) => {
    cache.reset();
    ctx.body = {
        success: true,
    };
});

export default adminRouter;