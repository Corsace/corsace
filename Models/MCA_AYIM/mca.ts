import { Entity, Column, BaseEntity, PrimaryColumn, OneToMany, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { MCAInfo, PhaseType } from "../../Interfaces/mca";
import { Phase } from "../phase";
import { Category } from "./category";

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

    static fillAndSave (data, mca?: MCA): Promise<MCA> {
        if (!mca) {
            mca = new MCA;
            mca.year = data.year;
        }

        mca.nomination = {
            start: data.nominationStart,
            end: data.nominationEnd,
        };
        mca.voting = {
            start: data.votingStart,
            end: data.votingEnd,
        };
        mca.results = data.results;

        return mca.save();
    }

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
            phase: this.currentPhase(),
            nomination: this.nomination,
            voting: this.voting,
            results: this.results,
            categories: this.categories,
        };
    }

    public currentPhase (this: MCA): PhaseType {
        let phase: PhaseType = "preparation";
        const newDate = new Date;
        
        if (newDate > this.nomination.start && newDate < this.nomination.end) {
            phase = "nominating";
        } else if (newDate > this.voting.start && newDate < this.voting.end) {
            phase = "voting";
        } else if (newDate > this.results) {
            phase = "results";
        }

        return phase;
    }

    public isNominationPhase (): boolean {
        const now = new Date();
    
        return now < this.nomination.end && now > this.nomination.start;
    }
}
