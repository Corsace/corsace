
import { execSync } from "child_process";
import { readFile, writeFile } from "fs";
import { IConfig } from "node-config-ts";
import { stdin, stdout } from "process";
import { createInterface } from "readline";

const redBackground = "\x1b[41m";
const redBoldBackground = "\x1b[41;1m";
const yellowBackground = "\x1b[43m";
const yellowBoldBackground = "\x1b[43;1m";
const greenBackground = "\x1b[42m";
const greenBoldBackground = "\x1b[42;1m";
const linkHighlight = "\x1b[44;1m";
const resetCode = "\x1b[0m";

const configPath = `./config/user/${process.env.USER}.json`;

const exec = (command: string) => execSync(command, { stdio: "inherit" });

readFile(configPath, "utf-8", async (err, data) => {
    if (err) {
        console.error(`${redBoldBackground}Error reading config file:${resetCode}\n`,err,`\n${redBoldBackground}Please create and copy the default config file shown in ./config/default.json to ${configPath} and try again.${resetCode}`);
        return;
    }

    const configData = JSON.parse(data) as IConfig;

    const getInfo = async (question: string, cb: ((result: string) => Promise<void>) | ((result: string) => void), initialText?: string) => {
        return new Promise<void>((resolve, reject) => {
            if (initialText)
                console.log(`\x1b[2J\x1b[H\n${initialText}`);
            const rl = createInterface(stdin, stdout);
            rl.question(question, async (result: string) => {
                await cb(result);
                writeFile(configPath, JSON.stringify(configData, null, 4), e => {
                    if (e) {
                        console.error(`${redBoldBackground}Error writing to config file:${resetCode}\n`,e);
                        reject(e);
                        return;
                    }
                    rl.close();
                    resolve();
                });
            });
        });
    };

    console.log("Let's get setup!");

    // Check osu! API key and prompt user to enter it if it's not set
    if (!configData.osu.v1.apiKey || configData.osu.v1.apiKey === "obtain from https://osu.ppy.sh/p/api/")
        await getInfo("osu! API V1 key: ", (apiKey: string) => configData.osu.v1.apiKey = apiKey, `osu! API key is not set.\nYou can get it from the ${greenBoldBackground}Legacy API${resetCode} section at the bottom of ${linkHighlight}"https://osu.ppy.sh/home/account/edit"${resetCode}.`);

    // Check osu! API v2 client ID and secret and prompt user to enter it if it's not set
    if (!configData.osu.v2.clientId || !configData.osu.v2.clientSecret || configData.osu.v2.clientId === "obtain from https://osu.ppy.sh/home/account/edit" || configData.osu.v2.clientSecret === "obtain from https://osu.ppy.sh/home/account/edit") {
        await getInfo("osu! API V2 client ID: ", (clientId: string) => configData.osu.v2.clientId = clientId, `osu! API V2 client ID and secret are not set.\nYou can get it by creating an application at "https://osu.ppy.sh/home/account/edit"\nSet the callback URL to ${linkHighlight}${configData.corsace.publicUrl}/api/login/osu/callback${resetCode}\n${yellowBoldBackground}Do not share this information with anyone.${resetCode}`);
        await getInfo("osu! API V2 client secret: ", (clientSecret: string) => configData.osu.v2.clientSecret = clientSecret);
    }

    // Check osu! IRC password and prompt user to enter it if it's not set
    if (!configData.osu.bancho.username || !configData.osu.bancho.ircPassword || configData.osu.bancho.username === "bot account username, use your own for dev" || configData.osu.bancho.ircPassword === "obtain from https://osu.ppy.sh/home/account/edit#irc") {
        await getInfo("osu! IRC username: ", (username: string) => configData.osu.bancho.username = username, `osu! IRC username and password are not set.\nYou can get your password from the ${greenBoldBackground}Legacy API${resetCode} section at the bottom of ${linkHighlight}"https://osu.ppy.sh/home/account/edit"${resetCode}.`);
        await getInfo(`osu! IRC password: `, (password: string) => configData.osu.bancho.ircPassword = password);
        await getInfo(`Is this account a bot account? (y/n) Default: n `, (botAccount: string) => configData.osu.bancho.botAccount = botAccount.toLowerCase() === "y");
    }

    // Check discord server and channels
    if (!configData.discord.guild || configData.discord.guild === "guild ID")
        await getInfo("Discord server ID: ", (guild: string) => configData.discord.guild = guild, `Discord server ID is not set.\nCreate a new discord server for testing if you haven't already\nGet the ID by right-clicking the server icon and selecting "Copy Server ID".\n${yellowBoldBackground}If you haven't turned on Developer Mode in Discord, do so by going to User Settings -> Advanced -> Developer Mode.${resetCode}`);
    if (!configData.discord.logChannel || configData.discord.logChannel === "channel ID")
        await getInfo("Discord log channel ID: ", (logChannel: string) => configData.discord.logChannel = logChannel, `Discord log channel ID is not set.\nCreate one if you haven't already\nGet the ID by right-clicking the channel and selecting "Copy Channel ID".`);
    if (!configData.discord.coreChannel || configData.discord.coreChannel === "channel ID")
        await getInfo("Discord core channel ID: ", (coreChannel: string) => configData.discord.coreChannel = coreChannel, `Discord core channel ID is not set.\nCreate one if you haven't already\nGet the ID by right-clicking the channel and selecting "Copy Channel ID".`);

    // Check discord bot token and client ID and prompt user to enter it if it's not set
    if (!configData.discord.token || configData.discord.token === "bot token")
        await getInfo("Discord bot token: ", (token: string) => configData.discord.token = token, `Discord bot token is not set.\nCreate an application at ${linkHighlight}"https://discord.com/developers/applications"${resetCode}\nGo to the ${greenBoldBackground}Bot${resetCode} section\nPress "Reset Token"\nCopy the token, and paste it here.\n${yellowBoldBackground}Do not share this token with anyone.\nPlease make sure to provide the bot "Message Content Intent" and "Server Members" intents as well!${resetCode}`);
    if (!configData.discord.clientId || !configData.discord.clientSecret || configData.discord.clientId === "bot ID" || configData.discord.clientSecret === "bot secret") {
        await getInfo("Discord client ID: ", (clientId: string) => configData.discord.clientId = clientId, `Discord client ID and secret are not set.\nGo to the same application whose bot token you have obtained for at ${linkHighlight}"https://discord.com/developers/applications"${resetCode}\nGo to the ${greenBoldBackground}OAuth2${resetCode} section\nClick "Add Redirect" and paste ${configData.corsace.publicUrl}/api/login/discord/callback\nCopy the client ID and client secret from the top section of the page\nPaste it here 1 line at a time.\n${yellowBoldBackground}Do not share this information with anyone.${resetCode}`);
        await getInfo("Discord client secret: ", (clientSecret: string) => configData.discord.clientSecret = clientSecret);

        // Have the user invite the bot to their server
        await getInfo(`Invite the bot to your server by using this link: ${linkHighlight}https://discordapp.com/oauth2/authorize?&client_id=${configData.discord.clientId}&scope=bot&permissions=8${resetCode}\nPress enter when you're done.`, () => {
            // Do nothing
        });
    }
    if (!configData.discord.roles.corsace.corsace || configData.discord.roles.corsace.corsace === "role ID")
        await getInfo("Discord Corsace role ID: ", (corsace: string) => {
            configData.discord.roles.corsace.corsace = corsace;
            configData.discord.roles.corsace.core = corsace;
            configData.discord.roles.corsace.headStaff = [corsace];
            configData.discord.roles.corsace.staff = corsace;
        }, `Discord Corsace role ID is not set.\nCreate one if you haven't already\nGet the ID by right-clicking the role and selecting "Copy Role ID".`);
    if (!configData.discord.roles.corsace.verified || configData.discord.roles.corsace.verified === "role ID")
        await getInfo("Discord Verified role ID: ", (verified: string) => configData.discord.roles.corsace.verified = verified, `Discord Verified role ID is not set.\nCreate one if you haven't already\nGet the ID by right-clicking the role and selecting "Copy Role ID".`);

    // Check if the user has the database set up correctly
    if (!configData.database.host || !configData.database.port || !configData.database.database || !configData.database.username || !configData.database.password) {
        await getInfo("Database is not set, use default settings? (y/n) Default: y ", async (useDefault: string) => {
            if (useDefault.toLowerCase() === "n") {
                await getInfo("Database host (Example: localhost): ", (host: string) => configData.database.host = host);
                await getInfo("Database port (Example: 3306): ", (port: string) => configData.database.port = parseInt(port));
                await getInfo("Database name (Example: corsace): ", (database: string) => configData.database.database = database);
                await getInfo("Database username (Example: corsace): ", (username: string) => configData.database.username = username);
                await getInfo("Database password (Example: corsace): ", (password: string) => configData.database.password = password);
                return;
            }

            configData.database = {
                host: "localhost",
                port: 3306,
                database: "corsace",
                username: "corsace",
                password: "corsace",
            };
        });
    }

    // Migration stuff
    await getInfo(`Start the database service from docker/Do you have docker installed? ${redBackground}(Recommended)${resetCode} (y/n) Default: y `, (isDocker: string) => {
        if (isDocker.toLowerCase() !== "n")
            exec("npm run database");
    });
    await getInfo("Do you want to run the migration? (y/n) Default: y ", (ready: string) => {
        if (ready.toLowerCase() === "n")
            return;

        console.log(`\n${yellowBackground}Running migration...${resetCode}`);
        exec("npm run migration");
        console.log(`\n${greenBackground}Migration complete!${resetCode}`);
    });

    // Check if the user is going to contribute to the MCA/AYIM projects
    await getInfo("Will you be working on the MCA/AYIM project? (y/n) Default: n ", async (isMCA: string) => {
        if (isMCA.toLowerCase() !== "y")
            return;

        if (!configData.discord.roles.mca.standard || !configData.discord.roles.mca.taiko || !configData.discord.roles.mca.fruits || !configData.discord.roles.mca.mania || !configData.discord.roles.mca.storyboard || configData.discord.roles.mca.standard === "role ID")
            await getInfo("Discord MCA role ID: ", (mca: string) => {
                configData.discord.roles.mca.standard = mca;
                configData.discord.roles.mca.taiko = mca;
                configData.discord.roles.mca.fruits = mca;
                configData.discord.roles.mca.mania = mca;
                configData.discord.roles.mca.storyboard = mca;
            }, `Discord MCA role ID is not set.\nCreate one if you haven't already\nGet the ID by right-clicking the role and selecting "Copy Role ID".\n${yellowBoldBackground}This role is used for all modes.${resetCode}`);

        // Check BN account and prompt user to enter it if it's not set
        if (!configData.bn.username || !configData.bn.secret)
            await getInfo(`Do you have interop access to the ${linkHighlight}https://bn.mappersguild.com/${resetCode} site? (y/n) Default: n `, async (hasBN: string) => {
                if (hasBN.toLowerCase() !== "y")
                    return;

                await getInfo("BN username: ", (username: string) => configData.bn.username = username, `BN username and secret are not set.\nPlease provide your BN username and secret.\n${yellowBoldBackground}Do not share this information with anyone.${resetCode}`);
                await getInfo("BN secret: ", (secret: string) => configData.bn.secret = secret);
            });

        // Set up an initial MCA via npm run init:mca
        await getInfo(`Do you want to set up an initial MCA 2021 to work with? ${redBackground}(Recommended)${resetCode} (y/n) Default: y `, (initMCA: string) => {
            if (initMCA.toLowerCase() !== "n")
                exec("npm run init:mca");
        });
    });

    // Check if the user is going to contribute to the tournaments infrastructure
    await getInfo("Will you be working on the tournaments infrastructure? (y/n) Default: n ", async (isTournament: string) => {
        if (isTournament.toLowerCase() !== "y")
            return;

        if (!configData.s3.clients.r2.hostname || configData.s3.clients.r2.hostname === "<cloudflare account id>.r2.cloudflarestorage.com")
            await getInfo("Cloudflare R2 account ID: ", (hostname: string) => {
                configData.s3.clients.r2.hostname = `${hostname}.r2.cloudflarestorage.com`;
            }, `Cloudflare R2 account ID is not set.\nCreate a Cloudflare account if you haven't already from ${linkHighlight}https://dash.cloudflare.com/?to=/:account/r2${resetCode} and enable a plan (You will not exceed free limits)\nCopy and paste your account ID shown on the right of the ${greenBoldBackground}R2 Overview${resetCode} page.\n${yellowBoldBackground}Do not share this information with anyone.${resetCode}`);
        if (!configData.s3.buckets.mappacks.publicUrl || configData.s3.buckets.mappacks.publicUrl === "set custom domain or enable r2.dev url in bucket settings")
            await getInfo("Cloudflare R2 mappacks bucket URL: ", (publicUrl: string) => {
                configData.s3.buckets.mappacks.publicUrl = publicUrl;
            }, `Cloudflare R2 mappacks bucket URL is not set.\nCreate a bucket called ${greenBoldBackground}mappacks${resetCode} if you haven't already from the ${greenBoldBackground}R2 Overview${resetCode} page\nGo to the bucket settings and click "Allow Access" in the ${greenBoldBackground}R2.dev subdomain${resetCode} section\nCopy the URL and paste it here.\n${yellowBoldBackground}Do not share this information with anyone.${resetCode}`);
        await getInfo("", () => {
            // Do nothing
        }, `If you have already created a mappacks-temp bucket, press enter.\n\nOtherwise, create a bucket called ${greenBoldBackground}mappacks-temp${resetCode} from the ${greenBoldBackground}R2 Overview${resetCode} page\nGo to the bucket settings and click "Add rule" in the ${greenBoldBackground}Object lifecycle rules${resetCode} section\nSet the rule to ${greenBoldBackground}Delete after 1 day${resetCode}\nPress enter when you're done.`);
        if (!configData.s3.buckets.teamAvatars.publicUrl || configData.s3.buckets.teamAvatars.publicUrl === "set custom domain or enable r2.dev url in bucket settings")
            await getInfo("Cloudflare R2 team avatars bucket URL: ", (publicUrl: string) => {
                configData.s3.buckets.teamAvatars.publicUrl = publicUrl;
            }, `Cloudflare R2 team avatars bucket URL is not set.\nCreate a bucket called ${greenBoldBackground}tournament-team-avatars${resetCode} if you haven't already from the ${greenBoldBackground}R2 Overview${resetCode} page\nGo to the bucket settings and click "Allow Access" in the ${greenBoldBackground}R2.dev subdomain${resetCode} section\nCopy the URL and paste it here.\n${yellowBoldBackground}Do not share this information with anyone.${resetCode}`);

        // Set up an initial tournament via npm run init:tournament
        await getInfo(`Do you want to set up an initial test tournament to work with? ${redBackground}(Recommended)${resetCode} (y/n) Default: y `, (initTournament: string) => {
            if (initTournament.toLowerCase() !== "n")
                exec("npm run init:tournament");
        });
    });

    // Backup
    await getInfo(`Do you want to backup the database? ${redBackground}(Recommended)${resetCode} (y/n) Default: y `, (backup: string) => {
        if (backup.toLowerCase() !== "n")
            exec("NODE_ENV=development npm run backup");
    });
});