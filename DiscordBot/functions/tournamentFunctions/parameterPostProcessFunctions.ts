export function postProcessSlotOrder (param: string) {
    const slot = param.substring(0, param.length - 1).toUpperCase();
    const order = parseInt(param.substring(param.length - 1));
    return { slot, order };
}