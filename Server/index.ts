import "reflect-metadata";
import { createConnection } from "typeorm";
import Koa from "koa";
import BodyParser from "koa-bodyparser";
import Mount from "koa-mount";
import passport from "koa-passport";
import Session from "koa-session";
import { Config } from "../config";
import OAuth2Strategy from "passport-oauth2";
import { Strategy as DiscordStrategy } from "passport-discord";
import { User } from "../Models/user";
import discordRouter from "./login/discord";
import { discordPassport, osuPassport } from "./passportFunctions";
import osuRouter from "./login/osu";
import logoutRouter from "./logout";

export class App {

    public koa = new Koa;
    private config = new Config;

    constructor(type: string) {
        const subconfig = this.config[type];
        
        // Connect to DB
        createConnection({
            "type": "mariadb",
            "host": "localhost",
            "username": this.config.database.username,
            "password": this.config.database.password,
            "database": this.config.database.name,
            "timezone": "Z",
            "synchronize": true,
            "logging": false,
            "entities": [
                "../Models/**/*.ts",
            ],
        }).then((connection) => {
            console.log("Connected to the " + connection.options.database + " database!");
        }).catch(error => console.log("An error has occurred in connecting.", error));
        
        // Setup passport
        passport.use(new DiscordStrategy({
            clientID: this.config.discord.clientID,
            clientSecret: this.config.discord.clientSecret,
            callbackURL: subconfig.publicURL + "/api/login/discord/callback",
        }, discordPassport));

        passport.use(new OAuth2Strategy({
            authorizationURL: "https://osu.ppy.sh/oauth/authorize",
            tokenURL: "https://osu.ppy.sh/oauth/token",
            clientID: subconfig.osuID,
            clientSecret: subconfig.osuSecret,
            callbackURL: subconfig.publicURL + "/api/login/osu/callback",
        }, osuPassport));
    
        passport.serializeUser((user: User, done) => {
            done(null, user.ID);
        });
        passport.deserializeUser(async (id, done) => {
            if (!id) return done(null, null);
            try {
                const user = await User.findOne(id as number);
                if (user)
                    done(null, user);
                else
                    done(null, null);
            } catch(err) {
                console.log("Error while deserializing user", err);
                done(err, null);
            }        
        });

        this.koa.keys = subconfig.keys;
        this.koa.use(Session(this.koa));
        this.koa.use(BodyParser());
        this.koa.use(passport.initialize());
        this.koa.use(passport.session());
        this.koa.use(Mount("/login/discord", discordRouter.routes()));
        this.koa.use(Mount("/login/osu", osuRouter.routes()));
        this.koa.use(Mount("/logout", logoutRouter.routes()));
    }
}
