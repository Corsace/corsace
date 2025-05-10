declare module "node-config-ts" {
    export interface IRemoteServiceConfig {
        publicUrl: string;
    }
    interface IWebServiceConfig extends IRemoteServiceConfig {
        host: string;
        port: number;
    }
    export interface ISubSiteConfig extends IWebServiceConfig {
        ssr: boolean;
    }

    interface S3ClientConfig {
        hostname: string;
        port?: number | string;
        useSSL: boolean | string;
        path?: string;
        forcePathStyle?: boolean | string;
        region?: string;
        credentials: {
            accessKeyId: string;
            secretAccessKey: string;
        };
    }

    interface S3BucketConfig {
        clientName: keyof IConfig["s3"]["clients"];
        bucketName: string;
        publicUrl?: string;
    }

    interface IConfig {
        database: {
            host: string;
            port: number;
            database: string;
            username: string;
            password: string;
        };

        discord: {
            roles: {
                corsace: {
                    corsace: string;
                    core: string;
                    headStaff: string[];
                    staff: string;
                    writer: string;
                    verified: string;
                    streamAnnouncements: string;
                };
                mca: {
                    standard: string;
                    taiko: string;
                    fruits: string;
                    mania: string;
                    storyboard: string;
                };
            };
            token: string;
            guild: string;
            clientId: string;
            clientSecret: string;
            invite: string;
            logChannel: string;
            coreChannel: string;
        };

        osu: {
            proxyBaseUrl?: string;
            v1: {
                apiKey: string;
            };
            v2: {
                clientId: string;
                clientSecret: string;
            };
            bancho: {
                username: string;
                ircPassword: string;
                botAccount: boolean;
            };
        };

        bn: {
            username: string;
            secret: string;
        }

        s3: {
            clients: {
                r2: S3ClientConfig;
            };
            buckets: {
                mappacks: S3BucketConfig;
                mappacksTemp: S3BucketConfig;
                teamAvatars: S3BucketConfig;
            };
        }

        koaKeys: string[];
        cookiesDomain: string;

        ayim: ISubSiteConfig;
        corsace: ISubSiteConfig;
        closed: ISubSiteConfig;
        docs: IWebServiceConfig;
        mca: ISubSiteConfig;
        open: ISubSiteConfig;
        api: IWebServiceConfig;
        cronRunner: IWebServiceConfig;
        banchoBot: IWebServiceConfig;

        interOpAuth: {
            username: string;
            password: string;
        };

        github: {
            webhookSecret: string;
            webhookUrl: string;
            ignoredBranches?: string[];
        };

        centrifugo: {
            apiUrl: string;
            publicUrl: string;
            apiKey: string;
            ipWhitelist: string[];
        };
    }

    export const config: Config;
    export type Config = IConfig;
}
