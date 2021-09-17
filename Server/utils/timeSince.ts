const intervals = [
    "second",
    "minute",
    "hour",
    "day",
    "month",
    "year",
];

// googled Lol
const intervalDivisors = [
    1000,
    60000,
    3.6e+6,
    8.64e+7,
    2.628e+9,
    3.154e+10,
];

export default function timeSince (date1: Date, date2: Date, removeSuffix?: boolean): string {
    const earlierDate = date1.getTime() < date2.getTime() ? date1 : date2;
    const laterDate = date1.getTime() < date2.getTime() ? date2 : date1;
    const ms = laterDate.getTime() - earlierDate.getTime();

    let text = "";
    for (let i = 0; i < intervals.length; i++) {
        const val = Math.floor(ms / intervalDivisors[i]);
        if (i < intervals.length - 1 && val > intervalDivisors[i + 1] / intervalDivisors[i])
            continue;
        if (val <= 0)
            break;
        if (i === 0)
            text = `${val} ${intervals[i]}${val !== 1 ? "s" : ""} ${removeSuffix ? "" : "ago."}`;
        else {
            const prevVal = Math.floor((ms / intervalDivisors[i - 1]) % (intervalDivisors[i] / intervalDivisors[i - 1]));
            text = `${val} ${intervals[i]}${val !== 1 ? "s" : ""} and ${prevVal} ${intervals[i - 1]}${prevVal !== 1 ? "s" : ""} ${removeSuffix ? "" : "ago."}`;
        }
    }
    return text;
}