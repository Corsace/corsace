import { createInterface } from "readline";
import ormConfig from "../../ormconfig";
import { exit, stdin, stdout } from "process";
import { execSync } from "child_process";
import { config } from "node-config-ts";

if (process.env.NODE_ENV !== "development") {
    throw new Error("\x1b[41;1mTo prevent disasters, you can only run this script using NODE_ENV=development; you can't run this script in production.\nIf you are running this as a developer, run the script by writing \x1b[0m\x1b[42;1mNODE_ENV=development npm run restore\x1b[0m");
}

ormConfig.initialize().then(async (dataSource) => {
    // Delete and recreate database
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.dropDatabase("corsace", true);
    console.log("Database dropped");
    await queryRunner.createDatabase("corsace", true);
    console.log("Database recreated");

    createInterface(stdin, stdout).question("Enter backup name: ", backupName => {
        console.log(`\x1b[43;1mWhen prompted, put in your mariaDB password from your config file: \x1b[42;1m${config.database.password}\x1b[0m`);
        const dockerExecCommand = `docker-compose exec database bash -c "mysql -u corsace -p corsace < /bitnami/mariadb/${backupName.replace(".sql", "").trim()}.sql"`;

        try {
            execSync(dockerExecCommand, { stdio: "inherit" });
            console.log(`Database restored from ${backupName.replace(".sql", "").trim()}.sql`);
            exit(0);
        } catch (error) {
            console.error(`Error executing command: ${dockerExecCommand}`, error);
            exit(1);
        }
    });
}).catch(console.error);