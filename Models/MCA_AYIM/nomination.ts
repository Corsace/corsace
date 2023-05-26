import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne, Column, ManyToMany, SelectQueryBuilder, RelationId } from "typeorm";
import { User } from "../user";
import { Beatmapset } from "../beatmapset";
import { Category } from "./category";
import { Beatmap } from "../beatmap";

@Entity()
export class Nomination extends BaseEntity {
    
    @PrimaryGeneratedColumn()
        ID!: number;

    @ManyToMany(() => User, user => user.nominations)
        nominators!: User[];
    
    @RelationId((nomination: Nomination) => nomination.category)
        categoryID!: number;

    @ManyToOne(() => Category, category => category.nominations, {
        nullable: false,
        eager: true,
    })
        category!: Category;

    @RelationId((nomination: Nomination) => nomination.user)
        userID?: number;

    @ManyToOne(() => User, user => user.nominationsReceived, {
        eager: true,
    })
        user?: User;

    @RelationId((nomination: Nomination) => nomination.beatmapset)
        beatmapsetID?: number;
    
    @ManyToOne(() => Beatmapset, Beatmapset => Beatmapset.nominationsReceived, {
        eager: true,
    })
        beatmapset?: Beatmapset;

    @RelationId((nomination: Nomination) => nomination.beatmap)
        beatmapID?: number;
    
    @ManyToOne(() => Beatmap, Beatmap => Beatmap.nominationsReceived, {
        eager: true,
    })
        beatmap?: Beatmap;

    @Column({ default: false })
        isValid!: boolean;
    
    @RelationId((nomination: Nomination) => nomination.reviewer)
        reviewerID?: number;
    
    @ManyToOne(() => User, user => user.nominationReviews)
        reviewer?: User;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
        lastReviewedAt!: Date;

    static populate (): SelectQueryBuilder<Nomination> {
        return Nomination
            .createQueryBuilder("nomination")
            .innerJoinAndSelect("nomination.nominators", "nominator")
            .innerJoinAndSelect("nomination.category", "category")
            .innerJoinAndSelect("category.mca", "mca")
            .leftJoinAndSelect("nomination.user", "user")
            .leftJoinAndSelect("user.otherNames", "otherNames")
            .leftJoinAndSelect("nomination.beatmapset", "beatmapset")
            .leftJoinAndSelect("beatmapset.creator", "creator")
            .leftJoinAndSelect("nomination.beatmap", "beatmap")
            .leftJoinAndSelect("beatmap.beatmapset", "nominationBeatmapset")
            .leftJoinAndSelect("nominationBeatmapset.creator", "nominationBeatmapsetCreator");
    }

    static userNominations (options: { userID: number, year?: number }): SelectQueryBuilder<Nomination> {
        const query = Nomination
            .populate()
            .where("nominator.ID = :userID", { userID: options.userID });

        if (options.year) {
            query.andWhere("mca.year = :year", { year: options.year });
        }

        return query;
    }

}
