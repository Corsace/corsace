export function parseDateOrTimestamp (dateString: string) {
    return new Date(/\d{10}/.test(dateString) ? parseInt(dateString + "000") : dateString);
}

export function discordStringTimestamp (date: Date) {
    const seconds = date.getTime() / 1000;
    return `<t:${seconds}:F> (<t:${seconds}:R>)`;
}