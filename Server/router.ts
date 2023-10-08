import Router from "@koa/router";
import * as compose from "koa-compose";
import { DefaultContext, DefaultState, ParameterizedContext, ResponseBody } from "koa";

export type CorsaceContext<BodyT = any> = ParameterizedContext<DefaultState, DefaultContext, ResponseBody<BodyT>>;

export function requestWithCorsaceContext<T> (
    router: Router,
    requestType: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    ...middleware: compose.Middleware<CorsaceContext<T>>[]
): any {
    return router[requestType](path, ...middleware);
}