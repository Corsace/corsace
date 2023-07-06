import { Context } from "@nuxt/types";

export default async function ({ store }: Context) {
    if (!store.state.loggedInUser)
        await store.dispatch("setInitialData", "open");

    const date = new Date;

    if (!store.state["open"].tournament || store.state["open"].tournament.year !== date.getUTCFullYear())
        await store.dispatch("open/setInitialData", date.getUTCFullYear());
}
