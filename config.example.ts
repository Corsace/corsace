export class subConfig {
    host: string
    port: number
    publicURL: string
    keys: Array<string>
    osuID: number
    osuSecret: string
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

    ayim : subConfig

    corsace : subConfig

    invitational : subConfig

    mca : subConfig

    open : subConfig

    constructor() {
        this.database = {
            name: '',
            username: '',
            password: '',
        },
        this.osuV1 = '',
        this.discord = {
            roles: {
                corsace: {
                    corsace: '',
                    headStaff: '',
                    staff: '',
                    writer: '',
                },
                open: {
                    participants: '',
                    captains: '',
                    staff: '',
                    mappooler: '',
                    testplayer: '',
                    scheduler: '',
                    streamManager: '',
                    streamer: '',
                    commentator: '',
                    referee: '',
                },
                invitational: {
                    participants: '',
                    captains: '',
                    staff: '',
                    mappooler: '',
                    scheduler: '',
                    streamManager: '',
                    streamer: '',
                    commentator: '',
                    referee: '',
                },
                mca: {
                    staff: '',
                    standard: '',
                    taiko: '',
                    fruits: '',
                    mania: '',
                    storyboard: '',
                    arg: '',
                },
            },
            token: '',
            guild: '',
            clientID: '',
            clientSecret: '',
            invite: '',
            logChannel: '',
        }
        this.ayim = {
            host: '',
            port: 0,
            publicURL: '',
            keys: [''],
            osuID: 0,
            osuSecret: '',
        }
        this.corsace = {
            host: '',
            port: 0,
            publicURL: '',
            keys: [''],
            osuID: 0,
            osuSecret: '',
        }
        this.invitational = {
            host: '',
            port: 0,
            publicURL: '',
            keys: [''],
            osuID: 0,
            osuSecret: '',
        }
        this.mca = {
            host: '',
            port: 0,
            publicURL: '',
            keys: [''],
            osuID: 0,
            osuSecret: '',
        }
        this.open = {
            host: '',
            port: 0,
            publicURL: '',
            keys: [''],
            osuID: 0,
            osuSecret: '',
        }
    }
}