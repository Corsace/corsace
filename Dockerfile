FROM node:18-alpine AS base

WORKDIR /src

FROM base AS builder

COPY LICENSE package.json package-lock.json README.md tsconfig.json tsconfig.base.json ormconfig.ts /src/

RUN npm ci

COPY Assets/ /src/Assets/
COPY AYIM/ /src/AYIM/
COPY Closed/ /src/Closed/
COPY BanchoBot/ /src/BanchoBot/
COPY DiscordBot/ /src/DiscordBot/
COPY Interfaces/ /src/Interfaces/
COPY Main/ /src/Main/
COPY MCA/ /src/MCA/
COPY Models/ /src/Models/
COPY Open/ /src/Open/
COPY Server/ /src/Server/
COPY Typing/ /src/Typing/
COPY config/ /src/config/

RUN npm run build:ayim
RUN npm run build:mca
RUN npm run build:main
RUN npm run build:api
RUN npm run build:open
RUN npm run build:discord-bot
RUN npm run build:bancho-bot

ENV NODE_ENV=production
RUN npm prune --production

FROM base

ENV NODE_ENV=production

COPY --from=builder /src /src

ENTRYPOINT ["npm", "run"]
