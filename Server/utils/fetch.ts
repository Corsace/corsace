import { ResponseBody } from "koa";
import { HTTPError } from "../../Interfaces/error";

export async function fetch<T extends NonNullable<unknown>> (input: RequestInfo | URL, init?: RequestInit, isExternal?: boolean): Promise<ResponseBody<T>> {
    try {
        const res = await globalThis.fetch(input, init);
        if (!res.ok)
            return { success: false, error: new HTTPError(res.status, `HTTP error! status: ${res.status} ${res.statusText}`) };
        const json = await res.json() as T; // IDK
        if (isExternal)
            return Object.assign<T, { success: true }>(json, { success: true });
        return json as ResponseBody<T>;
    } catch (e) {
        if (e instanceof Error)
            return { success: false, error: `Failed to fetch ${e.name}\n${e.message}` };
        return { success: false, error: `Failed to fetch\n${e}` };
    }
}

export async function get<T> (url: string, init?: RequestInit, isExternal?: boolean): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "GET" }, isExternal);
}

export async function post<T> (url: string, body: any, init?: RequestInit, isExternal?: boolean): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "POST", body: JSON.stringify(body) }, isExternal);
}

export async function put<T> (url: string, body: any, init?: RequestInit, isExternal?: boolean): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "PUT", body: JSON.stringify(body) }, isExternal);
}

export async function del<T> (url: string, init?: RequestInit, isExternal?: boolean): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "DELETE" }, isExternal);
}

export async function patch<T> (url: string, body: any, init?: RequestInit, isExternal?: boolean): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "PATCH", body: JSON.stringify(body) }, isExternal);
}

export async function head<T> (url: string, init?: RequestInit, isExternal?: boolean): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "HEAD" }, isExternal);
}

export async function options<T> (url: string, init?: RequestInit, isExternal?: boolean): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "OPTIONS" }, isExternal);
}

export async function connect<T> (url: string, init?: RequestInit, isExternal?: boolean): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "CONNECT" }, isExternal);
}

export async function trace<T> (url: string, init?: RequestInit, isExternal?: boolean): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "TRACE" }, isExternal);
}