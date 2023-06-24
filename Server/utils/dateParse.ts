export function parseDateOrTimestamp (dateString: string) {
    return new Date(/\d{10}/.test(dateString) ? parseInt(dateString + "000") : dateString);
}

export function discordStringTimestamp (date: Date) {
    const seconds = date.getTime() / 1000;
    return `<t:${seconds}:F> (<t:${seconds}:R>)`;
}

export function convertDateToDDDHH (date) {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const day = days[date.getUTCDay()];
    let hour = date.getUTCHours();
    hour = hour < 10 ? "0" + hour : hour; // add leading zero if needed
    return `${day}-${hour}`;
}