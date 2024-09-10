import { execSync } from "child_process";
import { stdin, stdout } from "process";
import { createInterface } from "readline";
import { config } from "node-config-ts";

if (process.env.NODE_ENV !== "development") {
    throw new Error("\x1b[41;1mTo prevent disasters, you can only run this script using NODE_ENV=development; you can't run this script in production.\nIf you are running this as a developer, run the script by writing \x1b[0m\x1b[42;1mNODE_ENV=development npm run backup\x1b[0m");
}

function backupDatabase (backupName: string) {

    console.log(`\x1b[43;1mWhen prompted, put in your mariaDB password from your config file: \x1b[42;1m${config.database.password}\x1b[0m`);
    const dockerExecCommand = `docker-compose exec database bash -c "mysqldump -u corsace -p corsace > /bitnami/mariadb/${backupName}.sql"`;

    try {
        execSync(dockerExecCommand, { stdio: "inherit" });
        console.log(`Database backed up to ${backupName}.sql\nYou can run \`NODE_ENV=development npm run restore\` and input ${backupName} to restore the database to this state.`);
    } catch (error) {
        console.error(`Error executing command: ${dockerExecCommand}`, error);
    }
}

createInterface(stdin, stdout).question("Enter backup name: ", backupName => {
    backupDatabase(backupName.replace(".sql", "").trim());
    process.exit(0);
});
