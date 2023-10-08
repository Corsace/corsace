import Router from "@koa/router";
import * as compose from "koa-compose";
import { DefaultContext, DefaultState, ParameterizedContext, ResponseBody } from "koa";

export type CorsaceContext<BodyT = any, StateT = DefaultState, ContextT = DefaultContext> = ParameterizedContext<StateT, ContextT, ResponseBody<BodyT>>;

export type CorsaceMiddleware<BodyT = any, StateT = DefaultState, ContextT = DefaultContext> = compose.Middleware<CorsaceContext<BodyT, StateT, ContextT>>;

export interface CorsaceSuccessMessage { message: string }

export class CorsaceRouter<StateT = DefaultState, ContextT = DefaultContext> extends Router<StateT, ContextT> {
    $use<T> (...middleware: CorsaceMiddleware<T, StateT, ContextT>[]) {
        return super.use(...middleware);
    }

    $get<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.get(path, ...middleware);
    }

    $post<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.post(path, ...middleware);
    }

    $put<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.put(path, ...middleware);
    }

    $link<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.link(path, ...middleware);
    }

    $unlink<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.unlink(path, ...middleware);
    }

    $delete<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.delete(path, ...middleware);
    }

    $del<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.del(path, ...middleware);
    }

    $head<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.head(path, ...middleware);
    }

    $options<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.options(path, ...middleware);
    }

    $patch<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.patch(path, ...middleware);
    }

    $all<T> (path: string, ...middleware: CorsaceMiddleware<T>[]) {
        return super.all(path, ...middleware);
    }
}