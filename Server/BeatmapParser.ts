
import { parser } from "ojsama";
import readline from "readline";
import { EventEmitter } from "events";
import { Readable } from "stream";

class BeatmapParser extends EventEmitter implements NodeJS.WritableStream {
    writable = true;
    private readlineInput: Readable;
    private readline: readline.Interface;

    constructor (private parser: parser) {
        super();
        parser.reset();

        this.readlineInput = new Readable();
        // https://stackoverflow.com/a/22085851
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.readlineInput._read = () => {};

        this.readline = readline.createInterface({
            input: this.readlineInput,
            terminal: false,
        });
        this.readline.on("line", (line) => this.parser.feed_line(line));
        this.readline.on("close", () => {
            this.writable = false;
            this.emit("close");
            this.emit("finish");
        });
    }

    write (buffer: string | Uint8Array, cb?: (err?: Error | null) => void): boolean;
    write (str: string, encoding?: BufferEncoding, cb?: (err?: Error | null) => void): boolean;
    write (input: any, cbOrEncoding?: any, cb?: any): boolean {
        if (!this.writable) {
            const err = new Error("Stream is not writable");
            this.emit("error", err);
            cb(err);
        } else {
            if (input) {
                this.readlineInput.push(input.toString());
            }

            if (typeof cbOrEncoding === "function") {
                cbOrEncoding();
            } else if (typeof cb === "function") {
                cb();
            }
        }

        return true;
    }

    end (cb?: () => void): void;
    end (data: string | Uint8Array, cb?: () => void): void;
    end (str: string, encoding?: BufferEncoding, cb?: () => void): void;
    end (dataOrCb?: any, encodingOrCb?: any, cb?: any): void {
        if (dataOrCb && typeof dataOrCb !== "function") {
            this.write(dataOrCb, encodingOrCb);
        }

        this.readline.close();
        if (typeof dataOrCb === "function") {
            dataOrCb();
        } else if (typeof encodingOrCb === "function") {
            encodingOrCb();
        } else if (typeof cb === "function") {
            cb();
        }
    }
}

export { BeatmapParser };