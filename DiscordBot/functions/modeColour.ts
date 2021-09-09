import { Mode, ModeType } from "nodesu";

export default function modeColour (mode: ModeType) {
    switch (mode) {
        case Mode.taiko:
            return 0xFF0000;
        case Mode.ctb:
            return 0x007419;
        case Mode.mania:
            return 0xff6200;
        default:
            return 0xD65288;
    }
}