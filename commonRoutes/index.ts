import "reflect-metadata";
import * as Discord from "discord.js";
import {createConnection} from "typeorm";
import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import Mount from 'koa-mount';
import passport from "koa-passport";
import Session from 'koa-session';
import { Config } from "../config"
import { Strategy as DiscordStrategy } from "passport-discord";
import { User, OAuth } from '../CorsaceModels/user';
import discordRouter from "./login/discord"
import { osuRouter } from "./login/osu";

export class App {
    public discordClient = new Discord.Client();
    public discordGuild: Discord.Guild;

    public koa = new Koa();
    private config = new Config();

    constructor(URL: string, keys: Array<string>) {
        // Connect to Discord
        this.discordClient.login(this.config.discord.token)
        this.discordGuild = this.discordClient.guilds.get(this.config.discord.guild);

        // Create osu! router
        const osu = new osuRouter(URL);
        
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
               "../CorsaceModels/**/*.ts"
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
                if (!user)
                {
                    user = new User();
                    user.discord = new OAuth();
                    user.discord.dateAdded = new Date();
                }
        
                user.discord.userID = profile.id
                user.discord.username = profile.username
                user.discord.accessToken = accessToken;
                user.discord.refreshToken = refreshToken;
                user.discord.avatar = profile.avatar;
                user.lastLogin = user.discord.lastVerified = new Date();

                await user.save();
                done(null, user);
            } catch(error) {
                console.log("Error while authenticating user via Discord", error);
                done(error, null);
            }
        }));
        passport.serializeUser((user: User, done) => {
            done(null, user.id);
        });
        passport.deserializeUser(async (id, done) => {
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

        this.koa.keys = keys
        this.koa.use(Session(this.koa))
        this.koa.use(BodyParser());
        this.koa.use(passport.initialize());
        this.koa.use(passport.session());
        this.koa.use(Mount("/discord", discordRouter.routes()));
        this.koa.use(Mount("/osu", osu.router.routes()));
    }
}
