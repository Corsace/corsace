import { FindOptionsWhere, MigrationInterface, MoreThan, QueryRunner } from "typeorm";
import { Beatmapset } from "../beatmapset";
import { config } from "node-config-ts";
import { MoreThanOrEqual } from "typeorm";
import { BNEvent, getBNsApiCallRawData, getRankers } from "../../Server/scripts/fetchYearMaps";
import { resolve } from "path";
import { createReadStream, existsSync } from "fs";
import { createGunzip } from "zlib";
import streamToString from "stream-to-string";

export class BeatmapNominators1654558569754 implements MigrationInterface {
    name = 'BeatmapNominators1654558569754'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_maps_ranked_beatmapset\` (\`userID\` int NOT NULL, \`beatmapsetID\` int NOT NULL, INDEX \`IDX_3cda7daeb4ff2b0dbc4b90736c\` (\`userID\`), INDEX \`IDX_f0b456f4502aebcbfd9233edf7\` (\`beatmapsetID\`), PRIMARY KEY (\`userID\`, \`beatmapsetID\`)) ENGINE=InnoDB`);

        await queryRunner.query(`ALTER TABLE \`user_maps_ranked_beatmapset\` ADD CONSTRAINT \`FK_3cda7daeb4ff2b0dbc4b90736ca\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user_maps_ranked_beatmapset\` ADD CONSTRAINT \`FK_f0b456f4502aebcbfd9233edf70\` FOREIGN KEY (\`beatmapsetID\`) REFERENCES \`beatmapset\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // If .sql.gz file exists, just execute it
        const sqlGzFilePath = resolve(__dirname, "1654558569754-BeatmapNominators.sql.gz");
        if (existsSync(sqlGzFilePath)) {
            const bigSql = await streamToString(createReadStream(sqlGzFilePath).pipe(createGunzip()));
            const sqlInstructions = bigSql.split("\n").filter(sql => sql.trim().length !== 0);
            for(const sqlInstruction of sqlInstructions)
                if(sqlInstruction.trim().length !== 0)
                    await queryRunner.query(sqlInstruction);
            return;
        }

        // Otherwise, run the migration
        if (!config.bn.username || !config.bn.secret) {
            console.warn("WARNING: No BN website username/secret provided in config. Beatmapsets rankers will not be retrieved.");
        } else {
            let currentBeatmapsetId: number | null = null;
            const bnsRawData = new Map<Beatmapset['ID'], Promise<null | BNEvent[]>>();

            while (true) {
                const where: FindOptionsWhere<Beatmapset> = { approvedDate: MoreThanOrEqual(new Date('2019-01-01T00:00:00.000Z')) };
                if (currentBeatmapsetId) {
                    where.ID = MoreThan(currentBeatmapsetId);
                }
                const sets: Beatmapset[] = (await Beatmapset.find({
                    where,
                    order: { ID: 'ASC' },
                    take: 100,
                })).filter(set => set.approvedDate && set.approvedDate.getUTCFullYear() < 2021);

                if (sets.length === 0)
                    break;

                sets.forEach(set => bnsRawData.set(set.ID, getBNsApiCallRawData(set.ID)));

                for(const set of sets) {
                    currentBeatmapsetId = set.ID;
                    const rawData = await bnsRawData.get(set.ID);
                    bnsRawData.delete(set.ID);
                    if (rawData && rawData.length > 0) {
                        set.rankers = await getRankers(rawData);
                        console.log(`Adding ${set.rankers.length} rankers to set ${set.ID}`);
                        await set.save();
                    } else {
                        console.log(`Adding no ranker to set ${set.ID}`);
                    }
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_maps_ranked_beatmapset\` DROP FOREIGN KEY \`FK_f0b456f4502aebcbfd9233edf70\``);
        await queryRunner.query(`ALTER TABLE \`user_maps_ranked_beatmapset\` DROP FOREIGN KEY \`FK_3cda7daeb4ff2b0dbc4b90736ca\``);
        await queryRunner.query(`DROP INDEX \`IDX_f0b456f4502aebcbfd9233edf7\` ON \`user_maps_ranked_beatmapset\``);
        await queryRunner.query(`DROP INDEX \`IDX_3cda7daeb4ff2b0dbc4b90736c\` ON \`user_maps_ranked_beatmapset\``);
        await queryRunner.query(`DROP TABLE \`user_maps_ranked_beatmapset\``);
    }

}
