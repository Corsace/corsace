function encode (value: number): Buffer {
    let buffer = Buffer.alloc(0);
    for (;;) {
        let c = value & 0x7f;
        value >>= 7;
        if (value !== 0)
            c |= 0x80;
        buffer = Buffer.concat([buffer, new Uint8Array([c])]);
        if ((c & 0x80) === 0)
            break;
    }
    return buffer;
}

function decode (byteArray: Buffer): [number, number] {
    let result = 0;
    let shift = 0;
    let i = 0;
    for (;;) {
        const b = byteArray[i];
        i++;
        result = result | ((b & 0b01111111) << shift);
        if ((b & 0b10000000) === 0)
            break;
        shift += 7; 
    }
    return [ result + 1, i ];
}

export default {
    encode,
    decode,
};