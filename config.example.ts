export class Config {
    database : {
        name: string,
        username: string,
        password: string,
    };

    osuApi : {
        id: number,
        redirect: string,
        secret: string,
        v1: string,
    };

    ayim : {
        host: string,
        port: number,
    }

    corsace : {
        host: string,
        port: number,
    }

    invitational : {
        host: string,
        port: number,
    }

    mca : {
        host: string,
        port: number,
    }

    open : {
        host: string,
        port: number,
    }

    constructor() {
        this.database = {
            name: '',
            username: '',
            password: '',
        },
        this.osuApi = {
            id: 0,
            redirect: '',
            secret: '',
            v1: '',
        },
        this.ayim = {
            host: '',
            port: 0,
        }
        this.corsace = {
            host: '',
            port: 0,
        }
        this.invitational = {
            host: '',
            port: 0,
        }
        this.mca = {
            host: '',
            port: 0,
        }
        this.open = {
            host: '',
            port: 0,
        }
    }
}