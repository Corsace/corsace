import { Context } from "@nuxt/types";

export default async function ({ redirect, route, store }: Context) {
    if (!store.state.loggedInUser)
        await store.dispatch("setInitialData", "mca-ayim");
    let year: string | number = route.params.year;
    const lastYear = new Date().getUTCFullYear() - 1;

    // optional really but easier to understand where anyone is...
    // convert /nominating or /staff/nominations to /2020/nominating or /2020/staff/nominations
    if ((route.name && !/^20\d\d$/.test(year)) || route.path === "/") {
        return redirect({
            path: "/" + lastYear.toString() + route.path,
        });
    }

    year = /^20\d\d$/.test(year) ? parseInt(year) : lastYear;

    if (!store.state["mca-ayim"].mca || store.state["mca-ayim"].mca.year !== year)
        await store.dispatch("mca-ayim/setInitialData", year);

    if (route.path.includes("staff")) {
        if (store.hasModule("staff") && store.getters["mca-ayim/isMCAStaff"] && !store.state["mca-ayim"].staff?.mca)
            await store.dispatch("staff/setInitialData", year);
        else if (!store.hasModule("staff") || !store.getters["mca-ayim/isMCAStaff"])
            throw { statusCode: 403 };
    }
}
