import { Context } from "@nuxt/types";

export default async function ({ store }: Context) {
    if (!store.state.loggedInUser)
        await store.dispatch("setInitialData", "open");
}
