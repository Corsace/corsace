import { CorsaceRouter } from "../../../corsaceRouter";

const mappoolRouter  = new CorsaceRouter();

mappoolRouter.get("/", (ctx) => {
    ctx.body = {
        success: true,
    };
});

export default mappoolRouter;