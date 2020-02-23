export class SubConfig {
    host!: string;
    port!: number;
    publicURL!: string;
    keys!: Array<string>;
    osuID!: number;
    osuSecret!: string;
}

export class Config {
    database : {
        name: string,
        username: string,
        password: string,
    };

    discord: {
        roles: {
            corsace: {
                corsace: string,
                headStaff: string,
                staff: string,
                writer: string,
            },
            open: {
                participants: string,
                captains: string,
                staff: string,
                mappooler: string,
                testplayer: string,
                scheduler: string,
                streamManager: string,
                streamer: string,
                commentator: string,
                referee: string,
            },
            invitational: {
                participants: string,
                captains: string,
                staff: string,
                mappooler: string,
                scheduler: string,
                streamManager: string,
                streamer: string,
                commentator: string,
                referee: string,
            },
            mca: {
                staff: string,
                standard: string,
                taiko: string,
                fruits: string,
                mania: string,
                storyboard: string,
                arg: string,
            },
        },
        token: string,
        guild: string,
        clientID: string,
        clientSecret: string,
        invite: string,
        logChannel: string,
    };

    osuV1: string

    ayim : SubConfig

    corsace : SubConfig

    invitational : SubConfig

    mca : SubConfig

    open : SubConfig

    constructor() {
        this.database = {
            name: "DB_Name (not literally MariaDB)",
            username: "MariaDB username",
            password: "MariaDB password",
        },
        this.osuV1 = "osu! api key from https://osu.ppy.sh/p/api/",
        this.discord = {
            roles: {
                corsace: {
                    corsace: "role ID",
                    headStaff: "role ID",
                    staff: "role ID",
                    writer: "role ID",
                },
                open: {
                    participants: "role ID",
                    captains: "role ID",
                    staff: "role ID",
                    mappooler: "role ID",
                    testplayer: "role ID",
                    scheduler: "role ID",
                    streamManager: "role ID",
                    streamer: "role ID",
                    commentator: "role ID",
                    referee: "role ID",
                },
                invitational: {
                    participants: "role ID",
                    captains: "role ID",
                    staff: "role ID",
                    mappooler: "role ID",
                    scheduler: "role ID",
                    streamManager: "role ID",
                    streamer: "role ID",
                    commentator: "role ID",
                    referee: "role ID",
                },
                mca: {
                    staff: "role ID",
                    standard: "role ID",
                    taiko: "role ID",
                    fruits: "role ID",
                    mania: "role ID",
                    storyboard: "role ID",
                    arg: "role ID",
                },
            },
            token: "bot token",
            guild: "guild ID",
            clientID: "bot ID",
            clientSecret: "bot secret",
            invite: "invite link",
            logChannel: "channel ID",
        };
        this.ayim = {
            host: "localhost",
            port: 3000,
            publicURL: "http://localhost:3000",
            keys: [""],
            osuID: 0,
            osuSecret: "obtain from https://osu.ppy.sh/home/account/edit",
        };
        this.corsace = {
            host: "localhost",
            port: 4000,
            publicURL: "http://localhost:4000",
            keys: [""],
            osuID: 0,
            osuSecret: "obtain from https://osu.ppy.sh/home/account/edit",
        };
        this.invitational = {
            host: "localhost",
            port: 5000,
            publicURL: "http://localhost:5000",
            keys: [""],
            osuID: 0,
            osuSecret: "obtain from https://osu.ppy.sh/home/account/edit",
        };
        this.mca = {
            host: "localhost",
            port: 8000,
            publicURL: "http://localhost:8000",
            keys: [""],
            osuID: 0,
            osuSecret: "obtain from https://osu.ppy.sh/home/account/edit",
        };
        this.open = {
            host: "localhost",
            port: 7000,
            publicURL: "http://localhost:7000",
            keys: [""],
            osuID: 0,
            osuSecret: "obtain from https://osu.ppy.sh/home/account/edit",
        };
    }
}