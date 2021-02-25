declare module "node-config-ts" {
    interface ISubSiteConfig {
        host: string;
        port: number;
        publicUrl: string;
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
                    headStaff: string;
                    staff: string;
                    writer: string;
                    verified: string;
                };
                open: {
                    participants: string;
                    captains: string;
                    staff: string;
                    mappooler: string;
                    testplayer: string;
                    scheduler: string;
                    streamManager: string;
                    streamer: string;
                    commentator: string;
                    referee: string;
                };
                invitational: {
                    participants: string;
                    captains: string;
                    staff: string;
                    mappooler: string;
                    scheduler: string;
                    streamManager: string;
                    streamer: string;
                    commentator: string;
                    referee: string;
                };
                mca: {
                    staff: string;
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

        koaKeys: string[];

        ayim: ISubSiteConfig;
        corsace: ISubSiteConfig;
        invitational: ISubSiteConfig;
        mca: ISubSiteConfig;
        open: ISubSiteConfig;
    }

    export const config: Config;
    export type Config = IConfig;
}
