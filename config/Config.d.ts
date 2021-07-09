declare module "node-config-ts" {
    interface ISubSiteConfig {
        host: string;
        port: number;
        publicUrl: string;
        spa: boolean;
    }

    interface ITournamentConfig {
        participants: string;
        captains?: string;
        mappooler: string;
        mapper: string;
        testplayer: string;
        scrim: string;
        advisor: string;
        streamer: string;
        commentator: string;
        referee: string;
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
                    designer: string;
                    writer: string;
                    scheduler: string;
                    streamManager: string;
                    verified: string;
                };
                open: ITournamentConfig;
                closed: ITournamentConfig;
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
        cookiesDomain: string;

        ayim: ISubSiteConfig;
        corsace: ISubSiteConfig;
        closed: ISubSiteConfig;
        mca: ISubSiteConfig;
        open: ISubSiteConfig;
    }

    export const config: Config;
    export type Config = IConfig;
}
