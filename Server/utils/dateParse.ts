export function parseDateOrTimestamp (dateString: string) {
    return new Date(dateString.includes("-") || dateString.includes(" ") ? dateString : parseInt(dateString + "000"));
}