declare module "node-config-ts" {
    interface IWebServiceConfig {
        host: string;
        port: number;
        publicUrl: string;
    }
    interface ISubSiteConfig extends IWebServiceConfig {
        ssr: boolean;
    }

    interface IMappoolChannelConfig {
        admin: string;
        general: string;
        epic: string;
        update: string;
        testing: string;
        balancing: string;
        songDiscussion: string;
        songSubmission: string;
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
                    headStaff: string;
                    staff: string;
                    writer: string;
                    verified: string;
                    streamAnnouncements: string;
                };
                open: {
                    participants: string;
                    captains: string;
                    mapper: string[];
                    mappooler: string;
                    testplayer: string;
                    scheduler: string;
                    streamManager: string;
                    streamer: string;
                    commentator: string;
                    referee: string;
                };
                closed: {
                    participants: string;
                    captains: string;
                    mapper: string[];
                    mappooler: string;
                    testplayer: string;
                    scheduler: string;
                    streamManager: string;
                    streamer: string;
                    commentator: string;
                    referee: string;
                };
                mca: {
                    standard: string;
                    taiko: string;
                    fruits: string;
                    mania: string;
                    storyboard: string;
                    arg: string;
                };
            };
            token: string;
            guild: string;
            clientId: string;
            clientSecret: string;
            invite: string;
            logChannel: string;
            headChannel: string;
            coreChannel: string;
            openMappool: IMappoolChannelConfig;
            closedMappool: IMappoolChannelConfig;
        };

        osu: {
            v1: {
                apiKey: string;
            };
            v2: {
                clientId: string;
                clientSecret: string;
            };
        };

        google: {
            credentials: {
                private_key: string;
                client_email: string;
            };
            sheets: {
                todo: string;
                openMappool: string;
                closedMappool: string;
                songs: string;
            };
        };

        koaKeys: string[];
        cookiesDomain: string;

        ayim: ISubSiteConfig;
        corsace: ISubSiteConfig;
        closed: ISubSiteConfig;
        mca: ISubSiteConfig;
        open: ISubSiteConfig;
        api: IWebServiceConfig;
    }

    export const config: Config;
    export type Config = IConfig;
}
