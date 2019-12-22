import Router from 'koa-router';
import { User } from '../../CorsaceModels/user';
import Crypto from 'crypto';

const osuRouter = new Router();

osuRouter.get("/", async (ctx) => {
    ctx.body = {
        status: 'success',
        message: 'hello'
    }
    console.log("Good job OSU.")
})
osuRouter.get("/callback", async (ctx) => {
    ctx.body = {
        status: 'success',
        message: 'hello'
    }
    console.log("Good job OSU callback.")
})

export default osuRouter;