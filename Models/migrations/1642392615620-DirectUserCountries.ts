import { createReadStream } from "fs";
import {MigrationInterface, QueryRunner} from "typeorm";
import { createGunzip } from "zlib";
import streamToString from "stream-to-string";
import { resolve } from "path";


export class DirectUserCountries1642392615620 implements MigrationInterface {

    public async up (queryRunner: QueryRunner): Promise<void> {
        const bigSql = await streamToString(createReadStream(resolve(__dirname, "1642392615620-DirectUserCountries.sql.gz")).pipe(createGunzip()));
        const sqlInstructions = bigSql.split("\n").filter(sql => sql.trim().length !== 0);
        for(const sqlInstruction of sqlInstructions)
            if(sqlInstruction.trim().length !== 0)
                await queryRunner.query(sqlInstruction);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        if (process.env.NODE_ENV === "production")
            return;
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `country`");
    }

}
