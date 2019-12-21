import Router from 'koa-router';
import { User } from '../../CorsaceModels/user';
import Crypto from 'crypto';

const osuRouter = new Router();

osuRouter.get("/osu", async (ctx) => {
    ctx.body = {
        status: 'success',
        message: 'hello'
    }
    console.log("Good job.")
})
osuRouter.get("/osu/callback", async (ctx) => {
    ctx.body = {
        status: 'success',
        message: 'hello'
    }
    console.log("Good job.")
})

export default osuRouter;