import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config, IConfig, S3BucketConfig, S3ClientConfig } from "node-config-ts";
import { Readable } from "stream";

const _clients: Record<string, S3> = {};

for (const [clientName, clientConfig] of Object.entries<S3ClientConfig>(config.s3.clients)) {
    _clients[clientName] = new S3({
        endpoint: {
            hostname: clientConfig.hostname,
            port: clientConfig.port !== undefined ? Number(clientConfig.port) : undefined,
            protocol: `${clientConfig.useSSL}` === "true" ? "https:" : "http:",
            path: clientConfig.path ?? "/",
        },
        forcePathStyle: `${clientConfig.forcePathStyle}` === "true",
        region: clientConfig.region ?? "auto",
        credentials: clientConfig.credentials,
    });
}

const clients: Record<keyof IConfig["s3"]["clients"], S3> = _clients;

class S3Bucket {
    private readonly client: S3;
    public readonly clientName: string;
    public readonly bucketName: string;
    public readonly publicUrl?: string;

    constructor(bucketConfig: S3BucketConfig) {
        this.client = clients[bucketConfig.clientName];
        this.clientName = bucketConfig.clientName;
        this.bucketName = bucketConfig.bucketName;
        if (bucketConfig.publicUrl)
            this.publicUrl = bucketConfig.publicUrl.endsWith("/") ? bucketConfig.publicUrl.slice(0, -1) : bucketConfig.publicUrl;
    }

    getPublicUrl(path: string) {
        if(!this.publicUrl) throw new Error("No public url for this bucket");

        if(path.startsWith("/"))
            path = path.slice(1);

        return `${this.publicUrl}/${path}`;
    }

    /**
     * @param expiresIn expiration time in seconds
     */
    getSignedUrl(path: string, expiresIn?: number) {
        return getSignedUrl(
            this.client,
            new GetObjectCommand({
                Bucket: this.bucketName,
                Key: path,
            }),
            expiresIn !== undefined ? { expiresIn } : undefined,
        );
    }

    putObject(
        objectName: string,
        data: Buffer | Readable,
        mimeType = 'binary/octet-stream',
    ) {
        return new Upload({
            client: this.client,
            params: {
                Bucket: this.bucketName,
                Key: objectName,
                Body: data,
                ContentType: mimeType,
            },
        }).done();
    }

    async getObject(
        objectName: string,
    ) {
        return (await this.client.getObject({
            Bucket: this.bucketName,
            Key: objectName,
        })).Body as Readable | undefined;
    }

    async copyObject(
        objectName: string,
        sourceBucket: S3Bucket,
        sourceObjectName: string,
        mimeType = 'binary/octet-stream',
    ) {
        if (this.clientName !== sourceBucket.clientName) {
            const stream = await sourceBucket.getObject(sourceObjectName);
            if (!stream) {
                throw new Error("Source object does not exist");
            }
            return this.putObject(objectName, stream, mimeType);
        }

        return this.client.copyObject({
            Bucket: this.bucketName,
            Key: objectName,
            CopySource: `${sourceBucket.bucketName}/${encodeURIComponent(sourceObjectName).replace(/%2F/g, '/')}`,
            ContentType: mimeType,
        });
    }

    async deleteObject(
        objectName: string,
    ) {
        return this.client.deleteObject({
            Bucket: this.bucketName,
            Key: objectName,
        });
    }
}

const _buckets: Record<string, S3Bucket> = {};

for (const [bucketName, bucketConfig] of Object.entries(config.s3.buckets)) {
    _buckets[bucketName] = new S3Bucket(bucketConfig);
}

const buckets: Record<keyof IConfig["s3"]["buckets"], S3Bucket> = _buckets;

export { buckets };

