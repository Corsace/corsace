import { Entity, BaseEntity, PrimaryColumn, Column, ManyToOne, OneToMany, Index } from "typeorm";
import { GuestRequest } from "./MCA_AYIM/guestRequest";
import { ModeDivision, ModeDivisionType } from "./MCA_AYIM/modeDivision";
import { Beatmapset } from "./beatmapset";
import { Nomination } from "./MCA_AYIM/nomination";
import { Vote } from "./MCA_AYIM/vote";
import { BeatmapInfo } from "../Interfaces/beatmap";
import { Category } from "../Interfaces/category";
import { StageQuery } from "../Interfaces/queries";

@Entity()
export class Beatmap extends BaseEntity {

    @PrimaryColumn()
    ID!: number;

    @Column()
    beatmapsetID!: number;

    @ManyToOne(() => Beatmapset, beatmapset => beatmapset.beatmaps, {
        nullable: false,
    })
    beatmapset!: Beatmapset;

    @Column()
    totalLength!: number;

    @Column()
    hitLength!: number;

    @Column()
    difficulty!: string;

    @Column("double")
    circleSize!: number;

    @Column("double")
    overallDifficulty!: number;

    @Column("double")
    approachRate!: number;

    @Column("double")
    hpDrain!: number;

    @ManyToOne(() => ModeDivision, modeDivision => modeDivision.beatmaps, {
        nullable: false,
        eager: true,
    })
    mode!: ModeDivision;

    @Column()
    circles!: number;

    @Column()
    sliders!: number;

    @Column()
    spinners!: number;

    @Column("double")
    rating!: number;

    @Column({ default: false })
    storyboard!: boolean;

    @Column({ default: false })
    video!: boolean;

    @Column()
    playCount!: number;

    @Column()
    passCount!: number;

    @Column({ nullable: true })
    packs?: string;

    @Column({ nullable: true })
    maxCombo?: number;

    @Column("double", { nullable: true })
    aimSR?: number;

    @Column("double", { nullable: true })
    speedSR?: number;

    @Index()
    @Column("double")
    totalSR!: number;

    @OneToMany(() => GuestRequest, guestRequest => guestRequest.beatmap)
    guestRequests!: GuestRequest[];

    @OneToMany(() => Nomination, nomination => nomination.beatmap)
    nominationsReceived!: Nomination[];
    
    @OneToMany(() => Vote, vote => vote.beatmap)
    votesReceived!: Vote[];

    static search (year: number, modeId: number, stage: "voting" | "nominating", category: Category, query: StageQuery): Promise<[Beatmap[], number]> {
        // Initial repo setup
        const includeStoryboard = modeId === ModeDivisionType.storyboard;
        const queryBuilder = this.createQueryBuilder("beatmap")
            .leftJoinAndSelect("beatmap.beatmapset", "beatmapset");
        
        if (stage === "voting") {
            queryBuilder
                .innerJoinAndSelect(
                    "beatmap.nominationsReceived", 
                    "nominationReceived", 
                    "nominationReceived.isValid = true AND nominationReceived.categoryID = :categoryId", 
                    { categoryId: category.ID }
                );
        } else {
            queryBuilder
                .leftJoin(
                    "beatmap.nominationsReceived", 
                    "nominationReceived", 
                    "nominationReceived.categoryID = :categoryId", 
                    { categoryId: category.ID }
                )
                .where("(nominationReceived.isValid = true OR nominationReceived.isValid IS NULL)");
        }
        
        queryBuilder
            .leftJoinAndSelect("beatmapset.creator", "user")
            .leftJoinAndSelect("user.otherNames", "otherName")
            .andWhere(includeStoryboard ? "beatmap.storyboard = :q" : "beatmap.mode = :q", { q: includeStoryboard ? true : modeId })
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
                    .andWhere(`beatmap.totalSR>=${category.filter.minSR}`);
            if (category.filter.maxSR)
                queryBuilder
                    .andWhere(`beatmap.totalSR<=${category.filter.maxSR}`);
            if (category.filter.minCS)
                queryBuilder
                    .andWhere(`beatmap.circleSize>=${category.filter.minCS}`);
            if (category.filter.maxCS)
                queryBuilder
                    .andWhere(`beatmap.circleSize<=${category.filter.maxCS}`);
            if (category.filter.topOnly || includeStoryboard)
                queryBuilder
                    .andWhere((sqb) => {
                        const subSubQuery = sqb.subQuery()
                            .from(Beatmap, "refMap")
                            .select("max(refMap.totalSR)")
                            .where("beatmapsetID = beatmapset.ID")
                            .limit(1)
                            .getQuery();
                        return "beatmap.totalSR = " + subSubQuery;
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
    
    public getInfo (chosen = false): BeatmapInfo {
        return {
            setID: this.beatmapsetID,
            id: this.ID,
            artist: this.beatmapset.artist,
            title: this.beatmapset.title,
            hoster: this.beatmapset.creator.osu.username,
            difficulty: this.difficulty,
            chosen,
        };
    }

}
