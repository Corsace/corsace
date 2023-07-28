import axios from "axios";
import { RateLimiter } from "limiter";
import { osuV2Token, osuAPIV2Options, osuAPIV2ClientCredentials, osuV2Beatmapset, osuV2PlayedBeatmaps, osuV2User, osuV2Friend, osuV2Me } from "../../Interfaces/osuAPIV2";
import { User } from "../../Models/user";

// For any properties missing in the typings, go to Interfaces/osuAPIV2.ts and add only the properties you need there.
export class osuAPIV2 {
    private readonly clientID: string;
    private readonly clientSecret: string;

    private readonly disableRateLimiting: boolean;
    private readonly requestsPerMinute: number;
    private readonly baseURL: string;
    private readonly apiV2URL: string;

    private bucket?: RateLimiter;

    private clientCredentials?: osuAPIV2ClientCredentials;

    constructor (clientID: string, clientSecret: string, options?: osuAPIV2Options) {
        this.clientID = clientID;
        this.clientSecret = clientSecret;
        this.disableRateLimiting = options?.disableRateLimiting || false;
        this.requestsPerMinute = options?.requestsPerMinute || 60;
        this.baseURL = options?.baseURL || "https://osu.ppy.sh";
        this.apiV2URL = `${this.baseURL}/api/v2`;
        
        if (!this.disableRateLimiting)
            this.bucket = new RateLimiter({
                tokensPerInterval: this.requestsPerMinute, 
                interval: "minute",
            });
    }

    public async getFavouriteBeatmaps (userID: string, accessToken?: string, offset?: number): Promise<osuV2Beatmapset[]> {
        let endpoint = `/users/${userID}/beatmapsets/favourite?limit=51`;
        if (offset)
            endpoint += `&offset=${offset}`;
        return this.get<osuV2Beatmapset[]>(endpoint, accessToken || await this.getClientCredentials());
    }

    public async getPlayedBeatmaps (accessToken: string, year?: number, cursorString?: string): Promise<osuV2PlayedBeatmaps> {
        let endpoint = "/beatmapsets/search?played=played";
        if (year)
            endpoint += `&q=ranked%3D${year}`;
        if (cursorString)
            endpoint += `&cursor_string=${cursorString}`;
        return this.get<osuV2PlayedBeatmaps>(endpoint, accessToken);
    }

    public async getUser (userID: string, mode?: "osu" | "taiko" | "fruits" | "mania", accessToken?: string): Promise<osuV2User> {
        return this.get<osuV2User>(`/users${`/${userID}`}${mode ? `/${mode}` : ""}`, accessToken || await this.getClientCredentials());
    }

    public getMe (accessToken: string, mode?: "osu" | "taiko" | "fruits" | "mania"): Promise<osuV2Me> {
        return this.get<osuV2User>(`/me${mode ? `/${mode}` : ""}`, accessToken);
    }

    public getUserFriends (accessToken: string): Promise<osuV2Friend[]> {
        return this.get<osuV2Friend[]>("/friends", accessToken);
    }

    public async sendMessage (userID: string, message: string): Promise<boolean> {
        try {
            const token = await this.getClientCredentials();
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

    private async getClientCredentials (): Promise<string> {
        if (this.clientCredentials && (this.clientCredentials.expiresAt.getTime() - (new Date()).getTime()) / 1000 > 300)
            return this.clientCredentials.token;

        const data = await this.getToken("client_credentials", "public");

        this.clientCredentials = {
            token: data.access_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
        };

        return this.clientCredentials.token;
    }

    public async refreshToken (user: User): Promise<osuV2Token> {
        return this.getToken("refresh_token", undefined, await user.getRefreshToken("osu"));
    }

    private async getToken (grant_type: string, scope?: string, refresh_token?: string): Promise<osuV2Token> {
        if (this.bucket) 
            await this.bucket.removeTokens(1);

        const { data } = await axios.post(`${this.baseURL}/oauth/token`, {
            grant_type,
            client_id: this.clientID,
            client_secret: this.clientSecret,
            scope,
            refresh_token,
        });
        return data;
    }

    // Post and get functions
    private async post<T> (endpoint: string, payload: any, accessToken: string): Promise<T> {
        if (this.bucket) 
            await this.bucket.removeTokens(1);
        
        const { data } = await axios.post(this.apiV2URL + endpoint, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return data;
    }

    private async get<T> (endpoint: string, accessToken: string): Promise<T> {
        if (this.bucket) 
            await this.bucket.removeTokens(1);
        
        const { data } = await axios.get(this.apiV2URL + endpoint, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return data;
    }
}