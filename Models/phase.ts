import { Column } from "typeorm";

export class Phase {

    @Column({ type: "timestamp" })
    start!: Date;

    @Column({ type: "timestamp" })
    end!: Date;

}