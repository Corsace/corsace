FROM node:14-alpine

WORKDIR /src

COPY LICENSE package.json package-lock.json README.md tsconfig.json ormconfig.ts /src/

RUN npm ci

COPY Assets/ /src/Assets/
COPY AYIM/ /src/AYIM/
COPY Closed/ /src/Closed/
COPY DiscordBot/ /src/DiscordBot/
COPY Interfaces/ /src/Interfaces/
COPY Main/ /src/Main/
COPY MCA/ /src/MCA/
COPY MCA-AYIM/ /src/MCA-AYIM/
COPY Models/ /src/Models/
COPY Open/ /src/Open/
COPY Server/ /src/Server/
COPY Typing/ /src/Typing/
COPY config/ /src/config/

RUN npm run build:ayim
RUN npm run build:mca
RUN npm run build:main
RUN npm run build:api
RUN npm run build:discord-bot

ENV NODE_ENV=production
RUN npm prune --production

ENTRYPOINT ["npm", "run"]
