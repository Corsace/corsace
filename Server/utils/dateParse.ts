export function parseDateOrTimestamp (dateString: string) {
    return new Date(/\d{10}/.test(dateString) ? parseInt(dateString + "000") : dateString);
}