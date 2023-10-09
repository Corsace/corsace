import Router from "@koa/router";
import * as compose from "koa-compose";
import { DefaultContext, DefaultState, ParameterizedContext, ResponseBody } from "koa";

export type CorsaceContext<BodyT, StateT = DefaultState, ContextT = DefaultContext> = ParameterizedContext<StateT, ContextT, ResponseBody<BodyT>>;

export type CorsaceMiddleware<BodyT, StateT = DefaultState, ContextT = DefaultContext> = compose.Middleware<CorsaceContext<BodyT, StateT, ContextT>>;

export interface CorsaceSuccessMessage { message: string }

export class CorsaceRouter<StateT = DefaultState, ContextT = DefaultContext> extends Router<StateT, ContextT> {
    constructor (opt?: Router.RouterOptions) {
        super(opt);
    }

    $use<T = object> (...middleware: CorsaceMiddleware<T, StateT, ContextT>[]) {
        return super.use(...middleware);
    }

    $get<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.get<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $post<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.post<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $put<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.put<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $link<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.link<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $unlink<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.unlink<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $delete<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.delete<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $del<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.del<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $head<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.head<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $options<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.options<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $patch<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.patch<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $all<T = object, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.all<MethodStateT, MethodContextT>(path, ...middleware);
    }
}