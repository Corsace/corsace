import Router from "@koa/router";
import * as compose from "koa-compose";
import { DefaultContext, DefaultState, ParameterizedContext, ResponseBody } from "koa";

export type CorsaceContext<BodyT, StateT = DefaultState, ContextT = DefaultContext> = ParameterizedContext<StateT, ContextT, ResponseBody<BodyT>>;

export type CorsaceMiddleware<BodyT, StateT = DefaultState, ContextT = DefaultContext> = compose.Middleware<CorsaceContext<BodyT, StateT, ContextT>>;

export interface CorsaceSuccessMessage { message: string }

export class CorsaceRouter<StateT = DefaultState, ContextT = DefaultContext> extends Router<StateT, ContextT> {
    $use<T> (...middleware: CorsaceMiddleware<T, StateT, ContextT>[]) {
        return super.use(...middleware);
    }

    $get<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.get<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $post<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.post<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $put<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.put<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $link<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.link<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $unlink<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.unlink<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $delete<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.delete<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $del<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.del<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $head<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.head<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $options<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.options<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $patch<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.patch<MethodStateT, MethodContextT>(path, ...middleware);
    }

    $all<T, MethodStateT = StateT, MethodContextT = ContextT> (path: string, ...middleware: CorsaceMiddleware<T, MethodStateT, MethodContextT>[]) {
        return super.all<MethodStateT, MethodContextT>(path, ...middleware);
    }
}