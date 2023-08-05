import { Context } from "@nuxt/types";

export default async function ({ redirect, route, store }: Context) {
    if (!route.query.key)
        return redirect("/");

    await store.state["stream"].dispatch("setInitialData", route.query.key);
    if (!store.state["stream"].key)
        return redirect("/");

    return;
}