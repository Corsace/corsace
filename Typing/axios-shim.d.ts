import "axios";
import { ResponseBody } from "koa";

declare module "axios" {
    interface AxiosInstance {
        // Did not equate T to any to ensure that the response body is always defined
        request<T, R = AxiosResponse<ResponseBody<T>>> (config: AxiosRequestConfig): Promise<R>;
        get<T, R = AxiosResponse<ResponseBody<T>>>(url: string, config?: AxiosRequestConfig): Promise<R>;
        delete<T, R = AxiosResponse<ResponseBody<T>>>(url: string, config?: AxiosRequestConfig): Promise<R>;
        head<T, R = AxiosResponse<ResponseBody<T>>>(url: string, config?: AxiosRequestConfig): Promise<R>;
        options<T, R = AxiosResponse<ResponseBody<T>>>(url: string, config?: AxiosRequestConfig): Promise<R>;
        post<T, R = AxiosResponse<ResponseBody<T>>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
        put<T, R = AxiosResponse<ResponseBody<T>>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
        patch<T, R = AxiosResponse<ResponseBody<T>>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
    }
}
