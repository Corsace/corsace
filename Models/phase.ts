import { Column } from "typeorm";

export class Phase {

    @Column({ type: "datetime" })
        start!: Date;

    @Column({ type: "datetime" })
        end!: Date;

}