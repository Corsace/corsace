import { config } from "node-config-ts";
import { ConnectionOptions } from "typeorm";

export default {
    name: "default",
    type: "mariadb",
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    username: config.database.username,
    password: config.database.password,
    timezone: "Z",
    synchronize: false,
    logging: ["error"],
    entities: [
        "./Models/**/*.ts",
        "./Models/**/*.js",
    ],
    cache: {
        duration: 60000,
    },
} as ConnectionOptions;
