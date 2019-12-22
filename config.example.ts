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
                writer: string,
            },
            open: {
                participants: string,
                captains: string,
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
                mappooler: string,
                scheduler: string,
                streamManager: string,
                streamer: string,
                commentator: string,
                referee: string,
            },
            mca: {
                standard: string,
                taiko: string,
                fruits: string,
                mania: string,
                storyboard: string,
                arg: string,
                translator: string,
            },
        },
        token: string,
        guild: string,
        clientID: string,
        clientSecret: string,
        invite: string,
        logChannel: string,
    };

    osu : {
        id: number,
        secret: string,
        v1: string,
    };

    ayim : {
        host: string,
        port: number,
        publicURL: string,
        keys: Array<string>,
    }

    corsace : {
        host: string,
        port: number,
        publicURL: string,
        keys: Array<string>,
    }

    invitational : {
        host: string,
        port: number,
        publicURL: string,
        keys: Array<string>,
    }

    mca : {
        host: string,
        port: number,
        publicURL: string,
        keys: Array<string>,
    }

    open : {
        host: string,
        port: number,
        publicURL: string,
        keys: Array<string>,
    }

    constructor() {
        this.database = {
            name: '',
            username: '',
            password: '',
        },
        this.osu = {
            id: 0,
            secret: '',
            v1: '',
        },
        this.discord = {
            roles: {
                corsace: {
                    corsace: '',
                    headStaff: '',
                    writer: '',
                },
                open: {
                    participants: '',
                    captains: '',
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
                    mappooler: '',
                    scheduler: '',
                    streamManager: '',
                    streamer: '',
                    commentator: '',
                    referee: '',
                },
                mca: {
                    standard: '',
                    taiko: '',
                    fruits: '',
                    mania: '',
                    storyboard: '',
                    arg: '',
                    translator: '',
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
        }
        this.corsace = {
            host: '',
            port: 0,
            publicURL: '',
            keys: [''],
        }
        this.invitational = {
            host: '',
            port: 0,
            publicURL: '',
            keys: [''],
        }
        this.mca = {
            host: '',
            port: 0,
            publicURL: '',
            keys: [''],
        }
        this.open = {
            host: '',
            port: 0,
            publicURL: '',
            keys: [''],
        }
    }
}