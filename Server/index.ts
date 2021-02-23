import "reflect-metadata";
import { createConnection, getConnectionManager } from "typeorm";
import Koa from "koa";
import BodyParser from "koa-bodyparser";
import Mount from "koa-mount";
import passport from "koa-passport";
import Session from "koa-session";
import { Config } from "../config";
import OAuth2Strategy from "passport-oauth2";
import { Strategy as DiscordStrategy } from "passport-discord";
import { User } from "../Models/user";
import { discordPassport, osuPassport } from "./passportFunctions";
import logoutRouter from "./logout";

export class App {

    public koa = new Koa;
    private config = new Config;
    private hasCreatedConnection = false;

    constructor () {
        // Cant use promise here cuz passport stops working... Errors inc
        this.initializeDb();
        this.setupPassport();

        this.koa.keys = this.config.database.keys;
        this.koa.use(Session(this.koa));
        this.koa.use(BodyParser());
        this.koa.use(passport.initialize());
        this.koa.use(passport.session());

        // Error handler
        this.koa.use(async (ctx, next) => {
            try {
                if (ctx.originalUrl !== "/favicon.ico") {
                    console.log("\x1b[33m%s\x1b[0m", ctx.originalUrl);
                }

                await next();
            } catch (err) {
                console.log(err);
                
                ctx.status = err.status || 500;
                ctx.body = { error: "Something went wrong!" };
            }
        });

        this.koa.use(Mount("/logout", logoutRouter.routes()));
    }

    async initializeDb () {
        try {
            const currentConnection = getConnectionManager().has("default") ? getConnectionManager().get("default") : undefined;

            // Code was reloaded but connection is still open or exists but disconnected idk why
            if (currentConnection && !this.hasCreatedConnection) {
                console.log("Recreating connection due to hot reloading");
                
                if (currentConnection.isConnected) {
                    await currentConnection.close();
                }

                console.log("Done closing");
            } else if (currentConnection) {
                console.log("Connection already created");

                if (!currentConnection.isConnected) {
                    console.log("Reconnecting DB");
                    await currentConnection.connect();
                }

                return;
            }

            console.log("Making new connection...");
            this.hasCreatedConnection = true;
    
            // Connect to DB
            const connection = await createConnection({
                "name": "default",
                "type": "mariadb",
                "host": "localhost",
                "username": this.config.database.username,
                "password": this.config.database.password,
                "database": this.config.database.name,
                "timezone": "Z",
                "synchronize": true,
                "logging": ["error"],
                "entities": [
                    "../Models/**/*.ts",
                ],
                "cache": {
                    duration: 60000,
                },
            });

            console.log(`Connected to the ${connection.options.database} (${connection.options.name}) database!`);
        } catch (error) {
            console.log("An error has occurred in connecting.", error);
        }
    }

    setupPassport () {
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
            clientID: this.config.discord.clientID,
            clientSecret: this.config.discord.clientSecret,
            callbackURL: this.config.corsace.publicURL + "/api/login/discord/callback",
        }, discordPassport));

        passport.use(new OAuth2Strategy({
            authorizationURL: "https://osu.ppy.sh/oauth/authorize",
            tokenURL: "https://osu.ppy.sh/oauth/token",
            clientID: this.config.osu.clientID,
            clientSecret: this.config.osu.clientSecret,
            callbackURL: this.config.corsace.publicURL + "/api/login/osu/callback",
        }, osuPassport));
    }
}
