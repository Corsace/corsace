import { Entity, Column, BaseEntity, PrimaryColumn, OneToMany } from "typeorm";
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

    @Column(type => Phase)
    nomination!: Phase;

    @Column(type => Phase)
    voting!: Phase;

    @Column({ type: "timestamp" })
    results!: Date;

    @OneToMany(type => Category, category => category.mca)
    categories!: Category[];

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


export interface MCAInfo {
    name: number;
    nomination: Phase;
    voting: Phase;
    results: Date;
    categories: Category[];
}