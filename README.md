Please use this repository when you are changing any of the code for Corsace projects.

To get started:
```
git clone --recurse-submodules https://github.com/VINXIS/Corsace
```

Install node-modules:
```
npm i
```

Duplicate `config.example.ts` and call the duplicate `config.ts`. Edit all parts as necessary.

(When adding callback URLs, the callback URL for discord is `http://host:port/api/login/discord/callback`, and the callback URL for osu! is `http://host:port/api/login/osu/callback`)

Run `npm run dev`, if you only want to run one of the projects, refer to the scripts in `package.json`.