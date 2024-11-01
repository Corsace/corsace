import { ResponseBody } from "koa";

export async function fetch<T> (input: RequestInfo | URL, init?: RequestInit): Promise<ResponseBody<T>> {
    try {
        const res = await globalThis.fetch(input, init);
        if (!res.ok)
            return Promise.resolve({ success: false, error: `Status ${res.status}\nFailed to fetch ${await res.text()}` });
        return res.json() as Promise<ResponseBody<T>>;
    } catch (e) {
        if (e instanceof Error)
            return Promise.resolve({ success: false, error: `Failed to fetch ${e.name}\n${e.message}` });
        return Promise.resolve({ success: false, error: `Failed to fetch ${e}` });
    }
}

export async function get<T> (url: string, init?: RequestInit): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "GET" });
}

export async function post<T> (url: string, body: any, init?: RequestInit): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "POST", body: JSON.stringify(body) });
}

export async function put<T> (url: string, body: any, init?: RequestInit): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "PUT", body: JSON.stringify(body) });
}

export async function patch<T> (url: string, body: any, init?: RequestInit): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "PATCH", body: JSON.stringify(body) });
}

export async function del<T> (url: string, init?: RequestInit): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "DELETE" });
}

export async function head<T> (url: string, init?: RequestInit): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "HEAD" });
}

export async function options<T> (url: string, init?: RequestInit): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "OPTIONS" });
}

export async function connect<T> (url: string, init?: RequestInit): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "CONNECT" });
}

export async function trace<T> (url: string, init?: RequestInit): Promise<ResponseBody<T>> {
    return fetch(url, { ...init, method: "TRACE" });
}