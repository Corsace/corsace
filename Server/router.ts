import Router from "@koa/router";
import * as compose from "koa-compose";
import { DefaultContext, DefaultState, ParameterizedContext, ResponseBody } from "koa";

export type CorsaceContext<BodyT = any> = ParameterizedContext<DefaultState, DefaultContext, ResponseBody<BodyT>>;

export class CorsaceRouter extends Router {
    $use<T> (...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.use(...middleware);
    }

    $get<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.get(path, ...middleware);
    }

    $post<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.post(path, ...middleware);
    }

    $put<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.put(path, ...middleware);
    }

    $link<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.link(path, ...middleware);
    }

    $unlink<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.unlink(path, ...middleware);
    }

    $delete<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.delete(path, ...middleware);
    }

    $del<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.del(path, ...middleware);
    }

    $head<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.head(path, ...middleware);
    }

    $options<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.options(path, ...middleware);
    }

    $patch<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.patch(path, ...middleware);
    }

    $all<T> (path: string, ...middleware: compose.Middleware<CorsaceContext<T>>[]) {
        return super.all(path, ...middleware);
    }
}