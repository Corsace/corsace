Please use this repository when you are changing any of the code for Corsace projects.

To get started:
```
git clone https://github.com/Corsace/Corsace
```

Install node-modules:
```
npm i
```

## Getting Started

Duplicate `config.example.ts` and call the duplicate `config.ts`. Edit all parts as necessary. 
The values in the constructor of `config.ts` will be referred to as `config` from now on.

### osu! API V1

`config.osuV1`

You can obtain your osu! API V1 key at https://osu.ppy.sh/p/api/

### Database

#### Setup

`config.database`

You will need to install [MariaDB](https://mariadb.org/) and create an empty database, named whatever you like. 

It can be as simple as running:
```
mysql -u root -p
MySQL> create database <new_db_name>; 
```

Make sure to update `config.database` to reflect your choice of database name and credentials.

#### Initial Data

To have something in the database from the beginning (esp. for MCA/AYIM), it is a good idea to run 
```
npm run fetchMaps -- <year>
``` 
so that you have a list of beatmaps(ets) and users from the get go after setting up your config.
Note: This can take a while! 2020 has over 100,000 maps to run through, and may take a few hours 
depending on your machine and internet connection. 
There is no shame in dipping out early with `Ctrl-C`.

Alternatively, after you create the database, run the command 
```
mysql -u <username> -p <new_database> < corsaceInit.sql
``` 
where `<username>` is your MariaDB username (such as `root` for example), and `<new_database>` is the name of the db you created. `corsaceInit.sql` is a pre-made DB which includes nothing but beatmaps from 2006 to 2020.

### Discord

#### Setup

`config.discord`

This is the most time-consuming part of the setup. 
You will need the following:

##### Enable Developer Mode
Check the option at 
```
User Settings > Appearance > Advanced > Developer Mode
```

This will allow you to right click users, roles, channels, etc to copy their IDs.

##### A Discord Server
Create a new Discord Server if you don't have one already. All it needs to have is a single channel.
Create a "staff" role and give it to yourself.

Right-click your server name and "Copy ID". Paste this into `config.discord.guild`.

Right-click your staff role and "Copy ID". You can either create a role for each corresponding role in the config, OR 
paste that role ID into the following config values to give yourself god-tier permissions.
```
config.discord.roles.corsace.corsace
config.discord.roles.corsace.headStaff
config.discord.roles.corsace.staff
```
and then into every other "staff" role in the config.

##### Discord Application
Go to https://discord.com/developers/applications and create a "New Application".

###### Client
You will need to add the "Client ID" and "Client Secret" to the config as follows:
```
this.discord {
    ...,
    clientID: "<Client ID>",
    clientSecret: "<Client Secret>",
}
```

###### OAuth2
Head to the OAuth2 section of the bot and add the following redirect URLs:
```
http://localhost:3000/api/login/discord/callback
http://localhost:4000/api/login/discord/callback
http://localhost:5000/api/login/discord/callback
http://localhost:7000/api/auth/discord/callback
http://localhost:7000/api/login/discord/callback
http://localhost:8000/api/login/discord/callback
```

Also add a redirect URL with your bot's specific Client ID that looks like:
```
https://discordapp.com/oauth2/authorize?&client_id=<CLIENT ID>&scope=bot&permissions=8
```
Follow this link to add your bot to your server.

Below, in the OAuth2 URL Generator section, set your redirect URL to
```
http://localhost:3000/api/login/discord/callback
```
This might also change based on which app you are working on.

###### Bot Token
Head to the Bot section of the bot and copy your bot token. 
Paste it into `config.discord.token`

### osu! API V2

#### Setup

`config.ayim`
`config.corsace`
`config.invitational`
`config.mca`
`config.open`
`config.<any other app>`

You will need to create a "New OAuth Application" at the bottom of https://osu.ppy.sh/home/account/edit.

For default local development, the callback URL should be set to:
```
http://localhost:8000/api/login/osu/callback
```
Note: You might need to change the port from 8000 to whatever your current app is using.

Copy your Client ID and Client Secret to update the app configs as follows:
```
this.<app> = {
    host: "localhost",
    ...,
    osuID: "<CLIENT ID>",
    osuSecret: "<CLIENT SECRET>",
};
```

#### Development

Run `npm run dev`, if you only want to run one of the projects, refer to the scripts in `package.json`.

Note: `npm run dev` can run into some concurrency issues. 
Either try rerunning it or running the individual project scripts.
