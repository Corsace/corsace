export function parseDateOrTimestamp (dateString: string) {
    return new Date(/^\d{10}$/.test(dateString) ? parseInt(dateString + "000") : dateString);
}

export function discordStringTimestamp (date: Date) {
    const seconds = Math.round(date.getTime() / 1000);
    return `<t:${seconds}:F> (<t:${seconds}:R>)`;
}

export function convertDateToDDDHH (date: Date) {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const day = days[date.getUTCDay()];
    const hour = date.getUTCHours();
    const hourString = hour < 10 ? "0" + hour : hour; // add leading zero if needed
    return `${day}-${hourString}`;
}

export function osuLogTimestamp (date: Date) {
    const year = date.getFullYear().toString();
    const month = ("0" + (date.getMonth() + 1)).slice(-2); // months are 0-based in JavaScript
    const day = ("0" + date.getDate()).slice(-2);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function toLocalISOString (date: Date) {
    const tzo = -date.getTimezoneOffset(),
        dif = tzo >= 0 ? "+" : "-",
        pad = function(num) {
            const norm = Math.floor(Math.abs(num));
            return (norm < 10 ? "0" : "") + norm;
        };
    return date.getFullYear() 
        + "-" + pad(date.getMonth() + 1)
        + "-" + pad(date.getDate())
        + "T" + pad(date.getHours())
        + ":" + pad(date.getMinutes()) 
        + ":" + pad(date.getSeconds()) 
        + dif + pad(tzo / 60) 
        + ":" + pad(tzo % 60);
}

export function getTimezoneOffset (timeZone?: string): number {
    const now = new Date();
    const tzString = now.toLocaleString("en-US", { timeZone });
    const localString = now.toLocaleString("en-US");
    const diff = (Date.parse(localString) - Date.parse(tzString)) / 3600000;
    const offset = diff + now.getTimezoneOffset() / 60;
    
    return -offset;
}