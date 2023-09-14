import { Context } from "@nuxt/types";

export default async function ({ redirect, route, store }: Context) {
    const key = route.query.key;
    if (typeof key !== "string" || !key)
        return redirect("/");

    await store.dispatch("stream/setInitialData", {
        key,
        stageID: route.query.stageID,
    });
    if (!store.state.stream.tournamentID)
        return redirect("/");

    return;
}