import { Context } from "@nuxt/types";

export default async function ({ redirect, route, store }: Context) {
    if (!store.state.loggedInUser)
        await store.dispatch("setInitialData", "corsace");
}
