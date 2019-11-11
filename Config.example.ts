export class Config {
    database : {
        name: string,
        username: string,
        password: string
    };

    osuApi : {
        id: number,
        redirect: string,
        secret: string,
        v1: string
    };

    keys: Array<string>;

    constructor() {
        this.database = {
            name: '',
            username: '',
            password: ''
        },
        this.osuApi = {
            id: 0,
            redirect: '',
            secret: '',
            v1: ''
        }
        this.keys = ['']
    }
}