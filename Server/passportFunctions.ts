import passport from "koa-passport";
import { config } from "node-config-ts";
import { Strategy as DiscordStrategy } from "passport-discord";
import OAuth2Strategy from "passport-oauth2";
import { User, OAuth } from "../Models/user";
import Axios from "axios";
import { discordClient } from "./discord";
import { UsernameChange } from "../Models/usernameChange";

export function setupPassport () {
    // Setup passport
    passport.serializeUser((user: User, done) => {
        done(null, user.ID);
    });

    passport.deserializeUser(async (id: number, done) => {
        if (!id) return done(null, null);

        try {
            const user = await User.findOne(id);
            if (user)
                done(null, user);
            else
                done(null, null);
        } catch(err) {
            console.log("Error while deserializing user", err);
            done(err, null);
        }        
    });

    passport.use(new DiscordStrategy({
        clientID: config.discord.clientId,
        clientSecret: config.discord.clientSecret,
        callbackURL: `${config.corsace.publicUrl}/api/login/discord/callback`,
    }, discordPassport));

    passport.use(new OAuth2Strategy({
        authorizationURL: "https://osu.ppy.sh/oauth/authorize",
        tokenURL: "https://osu.ppy.sh/oauth/token",
        clientID: config.osu.v2.clientId,
        clientSecret: config.osu.v2.clientSecret,
        callbackURL: `${config.corsace.publicUrl}/api/login/osu/callback`,
    }, osuPassport));
}

// If you are looking for osu and discord auth login endpoints info then go to Server > api > routes > login

export async function discordPassport (accessToken: string, refreshToken: string, profile: DiscordStrategy.Profile, done: OAuth2Strategy.VerifyCallback): Promise<void> {
    try {
        let user = await User.findOne({
            discord: {
                userID: profile.id,
            },
        });

        if (!user)
        {
            user = new User;
            user.discord = new OAuth;
            user.discord.dateAdded = user.registered = new Date;
        }

        user.discord.userID = profile.id;
        user.discord.username = profile.username;
        user.discord.accessToken = accessToken;
        user.discord.refreshToken = refreshToken;
        user.discord.avatar = (await discordClient.users.fetch(profile.id)).displayAvatarURL();
        user.lastLogin = user.discord.lastVerified = new Date;

        done(null, user);
    } catch(error) {
        console.log("Error while authenticating user via Discord", error);
        done(error, undefined);
    }
}

export async function osuPassport (accessToken: string, refreshToken: string, profile: any, done: OAuth2Strategy.VerifyCallback): Promise<void> {
    try {
        const res = await Axios.get("https://osu.ppy.sh/api/v2/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const userProfile = res.data;
        let user = await User.findOne({
            osu: {
                userID: userProfile.id,
            },
        });

        if (!user) {
            user = new User;
            user.osu = new OAuth;
            user.osu.dateAdded = user.registered = new Date;
        } else if (user.osu.username !== userProfile.username) {
            let nameChange = await UsernameChange.findOne({ 
                name: user.osu.username, 
                user, 
            });
            if (!nameChange) {
                nameChange = new UsernameChange;
                nameChange.name = user.osu.username;
                nameChange.user = user;
                await nameChange.save();
            }
        }

        user.osu.userID = userProfile.id;
        user.osu.username = userProfile.username;
        user.osu.avatar = userProfile.avatar_url;
        user.osu.accessToken = accessToken;
        user.osu.refreshToken = refreshToken;
        user.osu.lastVerified = user.lastLogin = new Date;

        done(null, user);
    } catch (error) {
        console.log("Error while authenticating user via osu!", error);
        done(error, undefined);
    }
}
