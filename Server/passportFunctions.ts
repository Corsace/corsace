import passport from "koa-passport";
import { config, IRemoteServiceConfig } from "node-config-ts";
import { Strategy as DiscordStrategy } from "passport-discord";
import OAuth2Strategy from "passport-oauth2";
import { User, DiscordOAuth, OsuOAuth } from "../Models/user";
import { discordClient } from "./discord";
import { UsernameChange } from "../Models/usernameChange";
import { osuV2Client } from "./osu";
import { Strategy } from "passport";

export function setupPassport () {
    // Setup passport
    passport.serializeUser((user: any, done) => {
        done(null, user.ID);
    });

    passport.deserializeUser(async (id: number, done) => {
        if (!id) return done(null, null);

        try {
            const user = await User.findOne({ where: { ID: id }});
            if (user)
                done(null, user);
            else
                done(null, null);
        } catch(err) {
            console.log("Error while deserializing user", err);
            done(err, null);
        }
    });
}

// If you are looking for osu and discord auth login endpoints info then go to Server > api > routes > login

async function discordPassport (accessToken: string, refreshToken: string, profile: DiscordStrategy.Profile, done: OAuth2Strategy.VerifyCallback): Promise<void> {
    try {
        let user = await User.findOne({
            where: {
                discord: {
                    userID: profile.id,
                },
            },
        });

        if (!user)
        {
            user = new User();
            user.discord = new DiscordOAuth();
            user.discord.dateAdded = user.registered = new Date();
        }

        user.discord.userID = profile.id;
        user.discord.username = `${profile.username}`;
        user.discord.accessToken = accessToken;
        user.discord.refreshToken = refreshToken;
        user.discord.avatar = (await discordClient.users.fetch(profile.id)).displayAvatarURL();
        user.lastLogin = user.discord.lastVerified = new Date();

        done(null, user);
    } catch(error: any) {
        console.log("Error while authenticating user via Discord", error);
        done(error, undefined);
    }
}

async function osuPassport (accessToken: string, refreshToken: string, profile: any, done: OAuth2Strategy.VerifyCallback): Promise<void> {
    try {
        const userProfile = await osuV2Client.getMe(accessToken);
        let user = await User.findOne({
            where: {
                osu: {
                    userID: userProfile.id.toString(),
                },
            },
        });

        if (!user) {
            user = new User();
            user.osu = new OsuOAuth();
            user.osu.dateAdded = user.registered = new Date();
        } else if (user.osu.username !== userProfile.username) {
            let nameChange = await UsernameChange.findOne({
                where: {
                    name: user.osu.username,
                    user: {
                        ID: user.ID,
                    },
                },
            });
            if (!nameChange) {
                nameChange = new UsernameChange();
                nameChange.name = user.osu.username;
                nameChange.user = user;
                await nameChange.save();
            }
        }

        user.country = userProfile.country_code;
        user.osu.userID = userProfile.id.toString();
        user.osu.username = userProfile.username;
        user.osu.avatar = userProfile.avatar_url;
        user.osu.accessToken = accessToken;
        user.osu.refreshToken = refreshToken;
        user.osu.lastVerified = user.lastLogin = new Date();

        done(null, user);
    } catch (error) {
        console.log("Error while authenticating user via osu!", error);
        if (error instanceof Error || !error)
            done(error as Error | null | undefined, undefined);
    }
}

const strategies = new Map<string, Strategy>();
export function getStrategy (kind: "discord" | "osu", site: string): { name: string; strategy: Strategy } {
    const name = `${kind}:${site}`;
    const callbackURL = `${(config[site as keyof typeof config] as IRemoteServiceConfig).publicUrl}/api/login/${kind}/callback`;
    let strategy = strategies.get(name);
    if (!strategy) {
        if(kind === "discord") {
            strategy = new DiscordStrategy({
                clientID: config.discord.clientId,
                clientSecret: config.discord.clientSecret,
                callbackURL,
            }, discordPassport);
        } else if (kind === "osu") {
            strategy = new OAuth2Strategy({
                authorizationURL: "https://osu.ppy.sh/oauth/authorize",
                tokenURL: `${config.osu.proxyBaseUrl ?? "https://osu.ppy.sh"}/oauth/token`,
                clientID: config.osu.v2.clientId,
                clientSecret: config.osu.v2.clientSecret,
                callbackURL,
            }, osuPassport);
        } else {
            throw new Error(`Unknown strategy kind ${kind}`);
        }
        passport.use(name, strategy);
        strategies.set(name, strategy);
    }
    return { name, strategy };
}
