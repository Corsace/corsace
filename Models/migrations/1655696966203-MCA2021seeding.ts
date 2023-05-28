import { MigrationInterface, QueryRunner } from "typeorm";
import { resolve } from "path";
import { createReadStream, existsSync } from "fs";
import { createGunzip } from "zlib";
import streamToString from "stream-to-string";

export class MCA2021Seeding1655696966203 implements MigrationInterface {
    name = "MCA2021Seeding1655696966203";

    public async up (queryRunner: QueryRunner): Promise<void> {
        // If .sql.gz file exists, just execute it
        const sqlGzFilePath = resolve(__dirname, "1655696966203-MCA2021seeding.sql.gz");
        if (existsSync(sqlGzFilePath)) {
            const bigSql = await streamToString(createReadStream(sqlGzFilePath).pipe(createGunzip()));
            const sqlInstructions = bigSql.split("\n").filter(sql => sql.trim().length !== 0);
            for(const sqlInstruction of sqlInstructions)
                if(sqlInstruction.trim().length !== 0)
                    await queryRunner.query(sqlInstruction);
            return;
        }

        console.warn("MCA 2021 seeding file doesn't exist, skipping migration");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        throw new Error("There is no going back.");
    }

}
