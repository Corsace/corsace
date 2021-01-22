import { Context } from "@nuxt/types";

export default async function ({ redirect, route, store }: Context) {
    let year: string | number = route.params.year;

    if (!/^20\d\d$/.test(year)) {
        return redirect({
            path: "/" + (new Date().getFullYear() - 1).toString() + route.path,
        });
    }

    year = parseInt(year);

    if (!store.state.phase || store.state.phase.year !== year) {
        await store.dispatch("setInitialData", year);

        if (store.getters.isMCAStaff) {
            await store.dispatch("staff/setInitialData");
        }
    }
}

