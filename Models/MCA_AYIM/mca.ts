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

    @Column({ type: "datetime" })
        results!: Date;

    @OneToMany(() => Category, category => category.mca)
        categories!: Category[];

    static fillAndSave (
        data: {
            year: number,
            nominationStart: Date | string,
            nominationEnd: Date | string,
            votingStart: Date | string,
            votingEnd: Date | string,
            results: Date | string,
        },
        mca?: MCA
    ): Promise<MCA> {
        if (!mca) {
            mca = new MCA();
            mca.year = data.year;
        }

        mca.nomination = {
            start: typeof data.nominationStart === "string" ? new Date(data.nominationStart) : data.nominationStart,
            end: typeof data.nominationEnd === "string" ? new Date(data.nominationEnd) : data.nominationEnd,
        };
        mca.voting = {
            start: typeof data.votingStart === "string" ? new Date(data.votingStart) : data.votingStart,
            end: typeof data.votingEnd === "string" ? new Date(data.votingEnd) : data.votingEnd,
        };
        mca.results = typeof data.results === "string" ? new Date(data.results) : data.results;

        return mca.save();
    }

    static current (): Promise<MCA> {
        const date = new Date();

        return MCA.findOneOrFail({
            where: {
                results: MoreThanOrEqual(date),
                nomination: {
                    start: LessThanOrEqual(date),
                },
            },
        });
    }

    static currentOrLatest (): Promise<MCA | null> {
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
    };

    public currentPhase (this: MCA): PhaseType {
        let phase: PhaseType = "preparation";
        const newDate = new Date();
        
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
