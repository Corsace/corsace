import { config } from "node-config-ts";
import { DataSource } from "typeorm";
import { resolve } from "path";

const ormConfig = new DataSource({
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
    maxQueryExecutionTime: 50,
    entities: [
        `${resolve(__dirname, "Models")}/**/*.ts`,
        `${resolve(__dirname, "Models")}/**/*.js`,
    ],
    cache: {
        duration: 60000,
    },
    migrations: [
        `${resolve(__dirname, "Models/migrations")}/*.ts`,
        `${resolve(__dirname, "Models/migrations")}/*.js`,
    ],
});

export const createQueryBuilder = () => ormConfig.createQueryBuilder();

export default ormConfig;
