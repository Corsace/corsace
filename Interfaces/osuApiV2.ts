import axios from "axios";
import { RateLimiter } from "limiter";

export interface osuAPIV2ChatBotOptions {
    disableRateLimiting: boolean;
    requestsPerMinute: number;
    baseURL: string;
}

export interface osuAPIV2ChatBotToken {
    token: string;
    expiresAt: Date;
}

export class osuAPIV2 {
    private readonly clientID: string;
    private readonly clientSecret: string;

    private readonly disableRateLimiting: boolean;
    private readonly requestsPerMinute: number;
    private readonly baseURL: string;

    private bucket?: RateLimiter;

    private chatBotToken?: osuAPIV2ChatBotToken;

    constructor (clientID: string, clientSecret: string, options?: osuAPIV2ChatBotOptions) {
        this.clientID = clientID;
        this.clientSecret = clientSecret;
        this.disableRateLimiting = options?.disableRateLimiting || false;
        this.requestsPerMinute = options?.requestsPerMinute || 60;
        this.baseURL = options?.baseURL || "https://osu.ppy.sh/api/v2";
        
        if (!this.disableRateLimiting)
            this.bucket = new RateLimiter({
                tokensPerInterval: this.requestsPerMinute, 
                interval: "minute",
            });
    }

    public getFavouriteBeatmaps (userID: string, accessToken: string, offset?: number) {
        let endpoint = `/users/${userID}/beatmapsets/favourite?limit=51`;
        if (offset)
            endpoint += `&offset=${offset}`;
        return this.get(endpoint, accessToken);
    }

    public getPlayedBeatmaps (accessToken: string, year?: number, cursorData?: any) {
        let endpoint = "/beatmapsets/search?played=played";
        if (year)
            endpoint += `&q=ranked%3D${year}`;
        if (cursorData)
            endpoint += `&cursor%5Bapproved_date%5D=${cursorData.approvedDate}&cursor%5B_id%5D=${cursorData._id}`;
        return this.get(endpoint, accessToken);
    }

    public getUserInfo (accessToken: string) {
        return this.get("/me", accessToken);
    }

    public getUserFriends (accessToken: string) {
        return this.get("/friends", accessToken);
    }

    public async sendMessage (userID: string, message: string): Promise<boolean> {
        try {
            const token = await this.getchatBotToken();
            await this.post("/chat/new", {
                target_id: userID,
                message,
                is_action: false,
            }, token);
        } catch (e) {
            if (e) return false;
        }
        return true;
    }

    private async getchatBotToken (): Promise<string> {
        if (this.chatBotToken && this.chatBotToken.expiresAt > new Date())
            return this.chatBotToken.token;

        let res: any;
        try {
            const { data } = await axios.post("https://osu.ppy.sh/oauth/token", {
                grant_type: "client_credentials",
                client_id: this.clientID,
                client_secret: this.clientSecret,
                scope: "delegate chat.write",
            });
            res = data;
        } catch (e) {
            if (e) throw e;
        }

        this.chatBotToken = {
            token: res.access_token,
            expiresAt: new Date(Date.now() + res.expires_in * 1000),
        };

        return this.chatBotToken.token;
    }

    // Post and get functions
    private async post (endpoint: string, payload: any, accessToken: string) {
        if (this.bucket) 
            await this.bucket.removeTokens(1);
        
        const { data } = await axios.post(this.baseURL + endpoint, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return data;
    }

    private async get (endpoint: string, accessToken: string) {
        if (this.bucket) 
            await this.bucket.removeTokens(1);
        
        const { data } = await axios.get(this.baseURL + endpoint, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return data;
    }
}