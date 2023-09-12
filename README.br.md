[![Crowdin](https://badges.crowdin.net/corsace/localized.svg)](https://translate.corsace.io) Se você deseja ajudar em traduções futuras, você pode fazer isso [aqui](https://translate.corsace.io)

Para clonar esse repositório:

| OS       | Cmd                                                                |
| -------- | ------------------------------------------------------------------ |
| WSL/Unix | git clone https://github.com/Corsace/Corsace                       |
| Windows* | git clone -c core.symlinks=true https://github.com/Corsace/Corsace |

*Use privilégios de administrador quando for rodar esse comando no seu console.

## Configuração Inicial

Instalando os módulos do Node:
```
npm i
```
**Nota: Certifique-se que sua versão do node é a 16.6.0 ou superior para poder usar qualquer uma das funcionalidades do Discord neste repositório.**

Duplique `config/default.json` para `config/user/$USER.json`, onde `$USER` é o nome de usuário do seu sistema [ (acessível através process.env.USER ou USERNAME do node)](https://github.com/tusharmath/node-config-ts#using-files). Os valores no seu arquivo de configuração pessoal `config/user/$USER.json` serão referidos como `config` daqui em diante.

### osu! API

`config.osu.v1.apiKey`

Você pode conseguir a chave API V1 [aqui](https://osu.ppy.sh/p/api/)

```
config.osu.v2.clientId
config.osu.v2.clientSecret
```

Você precisará criar uma "Nova Aplicação OAuth" na parte inferior de https://osu.ppy.sh/home/account/edit.

A URL de retorno (callback) deve ser definida como:
```
config.corsace.publicUrl + /api/login/osu/callback
```

```
config.osu.bancho
```

Você pode obter sua senha IRC do osu! no mesmo local em que obteve a Aplicação OAuth do osu! em https://osu.ppy.sh/home/account/edit#irc.

Se sua conta for uma conta de bot, certifique-se de ter `botAccount` definido como verdadeiro; caso contrário, defina-o como falso.

### Banco de Dados
`config.database`
#### Configuração

Existem duas maneiras de configurar o banco de dados: usando o Docker ou manualmente.

##### Usando o Docker (Recomendado)

Estamos disponibilizando um arquivo `docker-compose.yml` semelhante à produção. Você pode iniciar apenas o serviço do banco de dados usando: `docker-compose up -d database` ou `npm run database`.

O banco de dados estará acessível em `127.0.0.1:3306`, e o nome do banco de dados, nome de usuário e senha serão todos definidos como `corsace`.

##### Configuração Manual do MariaDB

Se você não deseja usar o Docker, precisará instalar o [MariaDB](https://mariadb.org/) e criar um banco de dados vazio, com o nome que desejar.

Pode ser tão simples quanto executar:
```
mysql -u root -p
MySQL> create database <new_db_name>; 
```

Certifique-se de atualizar `config.database` para refletir sua escolha de nome e credenciais do banco de dados.

#### Preenchendo o banco de dados

Crie e preencha todo o banco de dados Corsace usando: `NODE_ENV=development npm run -- typeorm migration:run -d ormconfig`

### Armazenamento de Objetos/S3

Usamos armazenamento de objetos compatível com S3 para armazenar e servir mappacks, configurado em `config.s3`.

Embora visemos o Cloudflare R2, qualquer provedor S3 deve funcionar, desde que eles suportem uploads multipart e URLs pré-assinadas.

Usamos três buckets:
- `team-avatars` é um bucket público que armazena avatares de equipe e pode ser servido por um CDN sem autenticação;
- `mappacks` é um bucket público que armazena mappacks públicos e pode ser servido por um CDN sem autenticação;
- `mappacks-temp` ié um bucket privado que armazena mappacks privados que não devem ter acesso público.  
  Os mappacks gerados são primeiro enviados para este bucket, e os usuários têm acesso através de URLs pré-assinadas.  
  Mappacks privados não devem ser armazenados permanentemente; uma política de ciclo de vida deve ser adicionada a esse bucket para excluir automaticamente objetos após 1 dia.  
  Mappacks que devem se tornar públicos são movidos para o bucket `mappacks`.

#### Cloudflare R2

Vá para a página do [painel do Cloudflare R2](https://dash.cloudflare.com/?to=/:account/r2). Ative seu plano se ainda não o fez (boa sorte ao exceder os limites gratuitos).

Create the `mappacks` and `team-avatars` buckets and enable their R2.dev subdomains, or associate a custom domain for each.

Create the `mappacks-temp` bucket and add an object lifecycle rule to delete objects after 7 days (leave prefix empty).

Set hostname to `<cloudflare account id>.r2.cloudflarestorage.com`, and obtain S3 credentials from https://dash.cloudflare.com/?to=/:account/r2/api-tokens. **Make sure you give the token `Edit` permissions instead of the default `Read` permissions.**

### Discord
`config.discord`
#### Setup

This is the most time-consuming part of the setup. You will need the following:

##### Enable Developer Mode
Check the option at
```
User Settings > Appearance > Advanced > Developer Mode
```

This will allow you to right click users, roles, channels, etc to copy their IDs.

##### A Discord Server
Create a new Discord Server if you don't have one already. All it needs to have is a single channel. Create a "staff" role and give it to yourself.

Right-click your server name and "Copy ID". Paste this into `config.discord.guild`.

Right-click your staff role and "Copy ID". You can either create a role for each corresponding role in the config, OR paste that role ID into the following config values to give yourself god-tier permissions.
```
config.discord.roles.corsace.corsace
config.discord.roles.corsace.core
config.discord.roles.corsace.headStaff
config.discord.roles.corsace.staff
```
and then into every other "staff" role in the config.

##### Discord Application
Go to https://discord.com/developers/applications and create a "New Application".

###### Client
You will need to add the "Client ID" and "Client Secret" to the config as follows:
```
discord: {
    ...,
    clientId: "<Client ID>",
    clientSecret: "<Client Secret>",
}
```

###### OAuth2
Head to the OAuth2 section of the bot and add the following redirect URL:
```
config.corsace.publicUrl + /api/login/discord/callback
```

Also add a redirect URL with your bot's specific Client ID that looks like:
```
https://discordapp.com/oauth2/authorize?&client_id=<CLIENT ID>&scope=bot&permissions=8
```
Follow this link to add your bot to your server.

###### Bot
Head to the Bot section of the bot and copy your bot token. Paste it into `config.discord.token`

Ensure you enable the `Server Members` and `Message Content` intents under the **Privileged Gateway Intents** subsection before usage, the bot will not start otherwise, and you will be provided a `[DISALLOWED INTENTS]` error.

###### GitHub Webhook
Completely optional, and only if you really want to track your GitHub fork's events on discord and want to utilize Corsace's Github Webhook.

In the discord channel you want to obtain GitHub notifications from, create a webhook from `settings -> Integrations -> Create Webhook`, copy its Webhook URL, and place it into your config in `config.github.webhookUrl`. Create a password and place it in `config.github.webhookSecret`.

On GitHub, go to the repository's settings, and create a new webhook. Place the following URL in:
```
config.corsace.publicUrl + /api/github
```
Set the content type to `application/json`, and the secret to the password you created earlier.

### Centrifugo

We use Centrifugo for real-time notifications. You can find the documentation [here](https://centrifugal.dev/docs/getting-started/introduction).

#### Setup

On Unix: Run `npm run centrifugo` to start the centrifugo server. It will be available at `http://localhost:8001` by default, unless you change the port in the config files.

On WSL/Windows OR if the above doesn't work: Install the binary from [latest releases](https://github.com/centrifugal/centrifugo/releases), and add it to the root folder of this project. Afterwards, run `npm run centrifugo:local` to start the centrifugo server. If you want to change the port, change the `-p` flag in the repective script in `package.json`, and your config file's api URL.

## Development

Run `npm run dev`, if you only want to run one of the projects, refer to the scripts in `package.json`. To run the project without the api, use `npm run dev-client`.

For more specific instructions on developing/contributing to some of these projects, refer to the documentation [here](https://docs.corsace.io/development/)
