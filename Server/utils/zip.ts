import archiver from "archiver";
import { PassThrough, Readable } from "stream";

export function zipFiles (files: { content: Readable, name: string }[]): Readable {
    const archive = archiver("zip");
    const passThrough = new PassThrough();

    archive.pipe(passThrough);

    for (const { content, name } of files) {
        archive.append(content, { name });
    }

    void archive.finalize().catch((err) => passThrough.emit("error", err));
    return passThrough as Readable;
}
