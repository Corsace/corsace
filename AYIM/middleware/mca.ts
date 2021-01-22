import { Context } from "@nuxt/types";

export default async function ({ redirect, route, store }: Context) {
    const year = route.params.year;

    if (!/^20\d\d$/.test(year)) {
        return redirect({
            name: route.name || "year",
            params: {
                year: (new Date().getFullYear() - 1).toString(),
            },
        });
    }

    if (!store.state.mca || store.state.mca.year != year) {
        await store.dispatch("setInitialData", year);
    }
}
