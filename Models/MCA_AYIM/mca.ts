import { Entity, Column, BaseEntity, PrimaryColumn, OneToMany, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { MCAInfo } from "../../Interfaces/mca";
import { Category } from "./category";

export class Phase {

    @Column({ type: "timestamp" })
    start!: Date;

    @Column({ type: "timestamp" })
    end!: Date;

}

@Entity()
export class MCA extends BaseEntity {

    @PrimaryColumn({ type: "year" })
    year!: number;

    @Column(() => Phase)
    nomination!: Phase;

    @Column(() => Phase)
    voting!: Phase;

    @Column({ type: "timestamp" })
    results!: Date;

    @OneToMany(() => Category, category => category.mca)
    categories!: Category[];

    static current (): Promise<MCA> {
        const date = new Date();

        return MCA.findOneOrFail({
            results: MoreThanOrEqual(date),
            nomination: {
                start: LessThanOrEqual(date),
            },
        });
    }

    static currentOrLatest (): Promise<MCA | undefined> {
        const date = new Date();

        return MCA.findOne({
            where: [
                {
                    results: MoreThanOrEqual(date),
                    nomination: {
                        start: LessThanOrEqual(date),
                    },
                },
                {
                    year: date.getUTCFullYear() - 1,
                },
            ],
            order: {
                results: "DESC",
            },
        });
    }

    public getInfo = function(this: MCA): MCAInfo {
        return {
            name: this.year,
            nomination: this.nomination,
            voting: this.voting,
            results: this.results,
            categories: this.categories,
        };
    }
}
