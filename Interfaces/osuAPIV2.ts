import axios from "axios";
import { RateLimiter } from "limiter";
import { User } from "../Models/user";

export interface osuAPIV2ChatBotOptions {
    disableRateLimiting: boolean;
    requestsPerMinute: number;
    baseURL: string;
}

export interface osuAPIV2ChatBotToken {
    token: string;
    expiresAt: Date;
}

export const scopes = ["identify", "public", "friends.read"];

export const bwsFilter = /(fanart|fan\sart|idol|voice|nominator|nominating|mapper|mapping|moderation|moderating|community|contributor|contribution|contribute|organize|organizing|pending|spotlights|aspire|newspaper|jabc|omc|taiko|catch|ctb|fruits|mania)/i;

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

    public getFavouriteBeatmaps (userID: string, accessToken?: string, offset?: number) {
        let endpoint = `/users/${userID}/beatmapsets/favourite?limit=51`;
        if (offset)
            endpoint += `&offset=${offset}`;
        return this.get(endpoint, accessToken);
    }

    public getPlayedBeatmaps (accessToken?: string, year?: number, cursorString?: string) {
        let endpoint = "/beatmapsets/search?played=played";
        if (year)
            endpoint += `&q=ranked%3D${year}`;
        if (cursorString)
            endpoint += `&cursor_string=${cursorString}`;
        return this.get(endpoint, accessToken);
    }

    public getUserInfo (accessToken?: string) {
        return this.get("/me", accessToken);
    }

    public getUserFriends (accessToken?: string) {
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
        if (this.chatBotToken && (this.chatBotToken.expiresAt.getTime() - (new Date()).getTime()) / 1000 > 300)
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

    // Refresh token
    public async refreshToken (user: User) {
        if (!user.osu.refreshToken)
            return;

        try {
            const { data } = await axios.post("https://osu.ppy.sh/oauth/token", {
                grant_type: "refresh_token",
                client_id: this.clientID,
                client_secret: this.clientSecret,
                refresh_token: user.osu.refreshToken,
            });
            return data;
        } catch (e) {
            if (e) throw e;
        }
    }

    // Post and get functions
    private async post (endpoint: string, payload: any, accessToken?: string) {
        if (this.bucket) 
            await this.bucket.removeTokens(1);
        
        const { data } = await axios.post(this.baseURL + endpoint, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return data;
    }

    private async get (endpoint: string, accessToken?: string) {
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