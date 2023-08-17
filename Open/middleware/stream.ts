import { Context } from "@nuxt/types";

export default async function ({ redirect, route, store }: Context) {
    if (!route.query.key)
        return redirect("/");

    await store.dispatch("stream/setInitialData", {
        key: route.query.key,
        stageID: route.query.stageID,
    });
    if (!store.state["stream"].tournamentID)
        return redirect("/");

    return;
}