Please use this repository when you are changing any of the code for Corsace projects.

To get started:
```
git clone https://github.com/Corsace/Corsace
```

Install node-modules:
```
npm i
```

Duplicate `config.example.ts` and call the duplicate `config.ts`. Edit all parts as necessary.

To have something in the database from the beginning (esp. for MCA/AYIM), it would be a good idea to run 
```
npm run fetchMaps -- <year>
``` 
so that you have a list of beatmaps(ets) and users from the get go after setting up your config.

Alternatively, after you create the database, run the command 
```
mysql -u <username> -p <new_database> < corsaceInit.sql
``` 
where `<username>` is your mariadb username (such as root for example), and `<new_database>` is the name of the db you created. `corsaceInit.sql` is a pre-made DB which includes nothing but beatmaps from 2006 to 2020.

(When adding callback URLs, the callback URL for discord is `http://host:port/api/login/discord/callback`, and the callback URL for osu! is `http://host:port/api/login/osu/callback`)

Run `npm run dev`, if you only want to run one of the projects, refer to the scripts in `package.json`.
