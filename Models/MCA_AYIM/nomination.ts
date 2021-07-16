import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne, Column, ManyToMany, SelectQueryBuilder } from "typeorm";
import { User } from "../user";
import { Beatmapset } from "../beatmapset";
import { Category } from "./category";

@Entity()
export class Nomination extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToMany(() => User, user => user.nominations)
    nominators!: User[];
    
    @ManyToOne(() => Category, category => category.nominations, {
        nullable: false,
        eager: true,
    })
    category!: Category;

    @ManyToOne(() => User, user => user.nominationsReceived, {
        eager: true,
    })
    user?: User;

    @ManyToOne(() => Beatmapset, Beatmapset => Beatmapset.nominationsReceived, {
        eager: true,
    })
    beatmapset?: Beatmapset;

    @Column({ default: false })
    isValid!: boolean;
    
    @ManyToOne(() => User, user => user.nominationReviews)
    reviewer?: User;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
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
            .leftJoinAndSelect("beatmapset.creator", "creator");
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
