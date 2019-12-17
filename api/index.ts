import "reflect-metadata";
import {createConnection} from "typeorm";
import Koa from 'koa';
import Router from 'koa-router';

const App = new Koa();
const AppRouter = new Router();

AppRouter.get("/test", (ctx) => {
    ctx.body = {
        status: 'success',
        message: 'hello'
    }
    console.log("Good job.")
});

App.use(AppRouter.routes());

createConnection().then(async (connection) => {
    console.log("Running at " + connection.name);
}).catch(error => console.log("An error has occurred in connecting: " + error));

export default {
    path: "/api",
    handler: App.callback(),
}
