import { Entity, BaseEntity, PrimaryColumn, OneToMany, Column, ManyToOne, SelectQueryBuilder, Index } from "typeorm";
import { BeatmapsetInfo } from "../Interfaces/beatmap";
import { Category } from "../Interfaces/category";
import { StageQuery } from "../Interfaces/queries";
import { Beatmap } from "./beatmap";
import { ModeDivisionType } from "./MCA_AYIM/modeDivision";
import { Nomination } from "./MCA_AYIM/nomination";
import { Vote } from "./MCA_AYIM/vote";
import { User } from "./user";

@Entity()
export class Beatmapset extends BaseEntity {
    
    @PrimaryColumn()
    ID!: number;
    
    @Column()
    artist!: string;

    @Column()
    title!: string;

    @Column()
    submitDate!: Date;

    @Index()
    @Column()
    approvedDate!: Date;

    @Column("double")
    BPM!: number;
    
    @Column()
    genre!: string;

    @Column()
    language!: string;
    
    @Column()
    favourites!: number;

    @Column({
        type: "longtext",
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_520_ci",
    })
    tags!: string;
    
    @OneToMany(() => Beatmap, beatmap => beatmap.beatmapset, {
        eager: true,
    })
    beatmaps!: Beatmap[];

    @ManyToOne(() => User, user => user.beatmapsets, {
        eager: true,
    })
    creator!: User;
    
    @OneToMany(() => Nomination, nomination => nomination.beatmapset)
    nominationsReceived!: Nomination[];
    
    @OneToMany(() => Vote, vote => vote.beatmapset)
    votesReceived!: Vote[];

    static search (year: number, modeId: number, stage: "voting" | "nominating", category: Category, query: StageQuery): Promise<[Beatmapset[], number]> {
        // Initial repo setup
        const includeStoryboard = modeId === ModeDivisionType.storyboard;
        const queryBuilder = this.createQueryBuilder("beatmapset");
        
        if (stage === "voting") {
            queryBuilder
                .innerJoinAndSelect(
                    "beatmapset.nominationsReceived", 
                    "nominationReceived", 
                    "nominationReceived.isValid = true AND nominationReceived.categoryID = :categoryId", 
                    { categoryId: category.ID }
                );
        } else {
            queryBuilder
                .leftJoin(
                    "beatmapset.nominationsReceived", 
                    "nominationReceived", 
                    "nominationReceived.categoryID = :categoryId", 
                    { categoryId: category.ID }
                )
                .where("(nominationReceived.isValid = true OR nominationReceived.isValid IS NULL)");
        }
        
        queryBuilder
            .leftJoinAndSelect("beatmapset.creator", "user")
            .leftJoinAndSelect("user.otherNames", "otherName")
            .innerJoinAndSelect("beatmapset.beatmaps", "beatmap", includeStoryboard ? "beatmap.storyboard = :q" : "beatmap.mode = :q", { q: includeStoryboard ? true : modeId })
            .andWhere("beatmapset.approvedDate BETWEEN :start AND :end", { start: `${year}-01-01`, end: `${year + 1}-01-01` });
                                
        // Check if the category has filters since this is a beatmap search
        if (category.filter) {
            if (category.filter.minLength)
                queryBuilder
                    .andWhere(`beatmap.hitLength>=${category.filter.minLength}`);
            if (category.filter.maxLength)
                queryBuilder
                    .andWhere(`beatmap.hitLength<=${category.filter.maxLength}`);
            if (category.filter.minBPM)
                queryBuilder
                    .andWhere(`beatmapset.BPM>=${category.filter.minBPM}`);
            if (category.filter.maxBPM)
                queryBuilder
                    .andWhere(`beatmapset.BPM<=${category.filter.maxBPM}`);
            if (category.filter.minSR)
                queryBuilder
                    .andWhere((qb) => {
                        const subQuery = qb.subQuery()
                            .from(Beatmap, "refMap")
                            .where("beatmapsetID = beatmapset.ID")
                            .andWhere(`refMap.totalSR<${category.filter!.minSR}`)
                            .getQuery();
        
                        return "NOT EXISTS " + subQuery;
                    });
            if (category.filter.maxSR)
                queryBuilder
                    .andWhere((qb) => {
                        const subQuery = qb.subQuery()
                            .from(Beatmap, "refMap")
                            .where("beatmapsetID = beatmapset.ID")
                            .andWhere(`refMap.totalSR>${category.filter!.maxSR}`)
                            .getQuery();
        
                        return "NOT EXISTS " + subQuery;
                    });
            if (category.filter.minCS)
                queryBuilder
                    .andWhere((qb) => {
                        const subQuery = qb.subQuery()
                            .from(Beatmap, "refMap")
                            .select("refMap.circleSize")
                            .where("beatmapsetID = beatmapset.ID")
                            .andWhere((sqb) => {
                                const subSubQuery = sqb.subQuery()
                                    .from(Beatmap, "refMap2")
                                    .select("max(refMap2.totalSR)")
                                    .where("beatmapsetID = beatmapset.ID")
                                    .limit(1)
                                    .getQuery();
                                return "refMap.totalSR = " + subSubQuery;
                            })
                            .getQuery();
        
                        return `${subQuery} >= ${category.filter!.minCS}`;
                    });
            if (category.filter.maxCS)
                queryBuilder
                    .andWhere((qb) => {
                        const subQuery = qb.subQuery()
                            .from(Beatmap, "refMap")
                            .select("refMap.circleSize")
                            .where("beatmapsetID = beatmapset.ID")
                            .andWhere((sqb) => {
                                const subSubQuery = sqb.subQuery()
                                    .from(Beatmap, "refMap2")
                                    .select("max(refMap2.totalSR)")
                                    .where("beatmapsetID = beatmapset.ID")
                                    .limit(1)
                                    .getQuery();
                                return "refMap.totalSR = " + subSubQuery;
                            })
                            .getQuery();

                        return `${subQuery} >= ${category.filter!.minCS}`;
                    });
        }

        // Check for search text
        if (query.text) {
            queryBuilder
                .andWhere("(beatmapset.ID LIKE :criteria OR " +
                    "beatmap.ID LIKE :criteria OR " + 
                    "beatmapset.artist LIKE :criteria OR " +
                    "beatmapset.title LIKE :criteria OR " +
                    "beatmapset.tags LIKE :criteria OR " + 
                    "beatmap.difficulty LIKE :criteria OR " +
                    "user.osuUsername LIKE :criteria OR " +
                    "user.osuUserid LIKE :criteria OR " +
                    "user.discordUserid LIKE :criteria OR " +
                    "user.discordUsername LIKE :criteria OR " +
                    "otherName.name LIKE :criteria)", { criteria: `%${query.text}%` });
        }
        
        // Check for favourites
        if (query.favourites?.length > 0)
            queryBuilder.andWhere("beatmapset.ID IN (" + query.favourites.join(",") + ")");

        // Check for played
        if (query.played?.length > 0)
            queryBuilder.andWhere("beatmapset.ID IN (" + query.played.join(",") + ")");
                   
        // Ordering
        const optionQuery = query.option ? query.option.toLowerCase() : "";
        const order = query.order || "ASC";
        let option = "beatmapset.approvedDate";
        if (/(artist|title|favs|creator|sr)/i.test(optionQuery)) {
            if (optionQuery.includes("artist"))
                option = "beatmapset.artist";
            else if (optionQuery.includes("title"))
                option = "beatmapset.title";
            else if (optionQuery.includes("favs"))
                option = "beatmapset.favourites";
            else if (optionQuery.includes("creator"))
                option = "user_osuUsername";
            else if (optionQuery.includes("sr"))
                option = "beatmap.totalSR";
        }

        // Search
        return Promise.all([
            queryBuilder
                .skip(query.skip)
                .take(50)
                .orderBy(option, order)
                .getMany(),
            
            queryBuilder.getCount(),
        ]);
    }

    static queryRecord (year: number, modeId: number): SelectQueryBuilder<Beatmapset> {
        return this
            .createQueryBuilder("beatmapset")
            .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId })
            .innerJoin("beatmapset.creator", "creator")
            .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
            .select(["beatmapset.ID", "beatmapset.title", "beatmapset.artist"])
            .addSelect(["creator.ID", "creator.osu.username", "creator.osu.userID"])
            .limit(3);
    }

    static queryStatistic (year: number, modeId: number): SelectQueryBuilder<Beatmapset> {
        return this
            .createQueryBuilder("beatmapset")
            .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId })
            .innerJoin("beatmapset.creator", "creator")
            .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
            .limit(1);
    }

    public getInfo (chosen = false): BeatmapsetInfo {
        return {
            id: this.ID,
            artist: this.artist,
            title: this.title,
            hoster: this.creator.osu.username,
            chosen,
        };
    }
}
