import { Statistic } from "../../../Interfaces/records";

const bnNatHistory = [
    {
        year: 2014,
        mode: "standard",
        bns: { joined: 72, left: 16 },
        nat: { joined: 16, left: 4 },
    },
    {
        year: 2014,
        mode: "taiko",
        bns: { joined: 11, left: 2 },
        nat: { joined: 3, left: 0 },
    },
    {
        year: 2014,
        mode: "fruits",
        bns: { joined: 5, left: 0 },
        nat: { joined: 3, left: 1 },
    },
    {
        year: 2014,
        mode: "mania",
        bns: { joined: 4, left: 1 },
        nat: { joined: 4, left: 1 },
    },
    {
        year: 2015,
        mode: "standard",
        bns: { joined: 46, left: 73 },
        nat: { joined: 10, left: 9 },
    },
    {
        year: 2015,
        mode: "taiko",
        bns: { joined: 9, left: 12 },
        nat: { joined: 2, left: 3 },
    },
    {
        year: 2015,
        mode: "fruits",
        bns: { joined: 6, left: 6 },
        nat: { joined: 1, left: 2 },
    },
    {
        year: 2015,
        mode: "mania",
        bns: { joined: 17, left: 11 },
        nat: { joined: 4, left: 5 },
    },
    {
        year: 2016,
        mode: "standard",
        bns: { joined: 26, left: 14 },
        nat: { joined: 4, left: 6 },
    },
    {
        year: 2016,
        mode: "taiko",
        bns: { joined: 6, left: 1 },
        nat: { joined: 1, left: 1 },
    },
    {
        year: 2016,
        mode: "fruits",
        bns: { joined: 5, left: 6 },
        nat: { joined: 1, left: 0 },
    },
    {
        year: 2016,
        mode: "mania",
        bns: { joined: 12, left: 5 },
        nat: { joined: 1, left: 1 },
    },
    {
        year: 2017,
        mode: "standard",
        bns: { joined: 24, left: 26 },
        nat: { joined: 4, left: 6 },
    },
    {
        year: 2017,
        mode: "taiko",
        bns: { joined: 9, left: 5 },
        nat: { joined: 2, left: 2 },
    },
    {
        year: 2017,
        mode: "fruits",
        bns: { joined: 5, left: 1 },
        nat: { joined: 0, left: 0 },
    },
    {
        year: 2017,
        mode: "mania",
        bns: { joined: 7, left: 9 },
        nat: { joined: 1, left: 0 },
    },
    {
        year: 2018,
        mode: "standard",
        bns: { joined: 63, left: 61 },
        nat: { joined: 15, left: 8 },
    },
    {
        year: 2018,
        mode: "taiko",
        bns: { joined: 8, left: 14 },
        nat: { joined: 2, left: 1 },
    },
    {
        year: 2018,
        mode: "fruits",
        bns: { joined: 5, left: 8 },
        nat: { joined: 1, left: 0 },
    },
    {
        year: 2018,
        mode: "mania",
        bns: { joined: 10, left: 14 },
        nat: { joined: 3, left: 3 },
    },
    {
        year: 2019,
        mode: "standard",
        bns: { joined: 53, left: 41 },
        nat: { joined: 3, left: 12 },
    },
    {
        year: 2019,
        mode: "taiko",
        bns: { joined: 13, left: 13 },
        nat: { joined: 2, left: 3 },
    },
    {
        year: 2019,
        mode: "fruits",
        bns: { joined: 16, left: 12 },
        nat: { joined: 1, left: 2 },
    },
    {
        year: 2019,
        mode: "mania",
        bns: { joined: 10, left: 7 },
        nat: { joined: 1, left: 2 },
    },
    {
        year: 2020,
        mode: "standard",
        bns: { joined: 51, left: 36 },
        nat: { joined: 3, left: 0 },
    },
    {
        year: 2020,
        mode: "taiko",
        bns: { joined: 27, left: 18 },
        nat: { joined: 1, left: 1 },
    },
    {
        year: 2020,
        mode: "catch",
        bns: { joined: 17, left: 19 },
        nat: { joined: 2, left: 1 },
    },
    {
        year: 2020,
        mode: "mania",
        bns: { joined: 20, left: 15 },
        nat: { joined: 1, left: 0 },
    },
    {
        year: 2021,
        mode: "standard",
        bns: { joined: 51, left: 45 },
        nat: { joined: 5, left: 5 },
    },
    {
        year: 2021,
        mode: "taiko",
        bns: { joined: 24, left: 18 },
        nat: { joined: 2, left: 1 },
    },
    {
        year: 2021,
        mode: "fruits",
        bns: { joined: 22, left: 16 },
        nat: { joined: 0, left: 0 },
    },
    {
        year: 2021,
        mode: "mania",
        bns: { joined: 14, left: 11 },
        nat: { joined: 2, left: 2 },
    },
];

export default function getHistoryStat (year: number, mode: string, group: "bns" | "nat", kind: "joined" | "left"): Statistic {
    return {
        constraint: group + " " + kind,
        value: bnNatHistory.find(h => h.year === year && h.mode === mode)?.[group][kind].toString() || "",
    };
}
