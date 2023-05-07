import archiver from 'archiver';
import { PassThrough, Stream } from 'stream';
import { promisify } from 'util';

export async function zipFiles(buffers: Buffer[], fileNames: string[]): Promise<Buffer> {
    const archive = archiver('zip');
    const bufferStream = new PassThrough();
    const finished = promisify(Stream.finished);
    const zipBuffer = new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        bufferStream.on('data', chunk => chunks.push(chunk));
        bufferStream.on('end', () => resolve(Buffer.concat(chunks)));
        bufferStream.on('error', reject);
    });

    archive.pipe(bufferStream);

    for (let i = 0; i < buffers.length; i++) {
        archive.append(buffers[i], { name: fileNames[i] });
    }

    archive.finalize();

    await finished(bufferStream);
    return zipBuffer;
}