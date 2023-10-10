import archiver from "archiver";
import { PassThrough, Readable } from "stream";

export async function zipFiles (files: { content: Readable, name: string }[]): Promise<Readable> {
    const archive = archiver("zip");
    const passThrough = new PassThrough();

    archive.pipe(passThrough);

    for (const { content, name } of files) {
        archive.append(content, { name });
    }

    await archive.finalize();
    return passThrough as Readable;
}
