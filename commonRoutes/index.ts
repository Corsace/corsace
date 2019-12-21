import "reflect-metadata";
import {createConnection} from "typeorm";
import Koa from 'koa';
import Router from 'koa-router';
import { Config } from "../config"
import * as passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { User } from '../CorsaceModels/user';
import discordRouter from "./login/discord"
import osuRouter from "./login/osu";

export class App {
    public koa = new Koa();
    public koaRouter = new Router();
    private config = new Config();

    constructor(URL: string) {
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
               "../../CorsaceModels/**/*.ts"
            ],
        }).then(async (connection) => {
            console.log("Connected to the " + connection.options.database + " database!");
        }).catch(error => console.log("An error has occurred in connecting.", error));
        
        // Setup passport
        passport.use(new DiscordStrategy({
            clientID: this.config.discord.clientID,
            clientSecret: this.config.discord.clientSecret,
            callbackURL: URL + "/api/discord/callback",
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ where: { "discord.userId": profile.id }});
                if(user)
                    user.lastLogin = user.discord.lastVerified = new Date();
                else
                {
                    user = new User();
                }
        
                user.discord.accessToken = accessToken;
                user.discord.refreshToken = refreshToken;
        
                await user.save();
                done(null, user);
            } catch(error) {
                console.log("Error while authenticating user via Discord", error);
                done(error);
            }
        }));
        passport.serializeUser(function(user, done) {
            done(null, user && user.id ? user.id : null);
        });
        passport.deserializeUser(async function(id, done) {
            try {
                let user = null;
                if(id)
                    user = await User.findOne(id);
                done(null, user);
            } catch(error) {
                console.log("Error while deserializing user", error);
                done(error, null);
            }        
        });
        
        // Configure api router
        this.koaRouter.use(passport.initialize());
        this.koaRouter.use(passport.session());
        this.koaRouter.get("/test", (ctx) => {
            ctx.body = {
                status: 'success',
                message: 'hello'
            }
            console.log("Good job.")
        });
        this.koaRouter.use("/discord", discordRouter.routes());
        this.koaRouter.use("/osu", osuRouter.routes());
        this.koaRouter.use("*", () => { throw new Error("404: NOT FOUND")});

        this.koa.use(this.koaRouter.routes());
    }
}
