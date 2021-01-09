
export class Timer {
    constructor() {
        this.start = Date.now();
        this.phases = [this.start];
        this.timesElapsed = [];
    }
    
    private start: number;

    private phases: number[];

    private timesElapsed: number[];

    public tick = (log = true): void => {
        this.phases.push(Date.now());
        if (log) {
            this.timesElapsed.push(this.phases[this.phases.length-1] - this.phases[this.phases.length-2]);
            console.log(`Elapsed: ${this.timesElapsed[this.timesElapsed.length-1]}ms`);
        }
    }

    public average = (): void => {
        console.log(`Average time elapsed: ${this.timesElapsed.reduce((a, b) => a + b, 0) / this.timesElapsed.length}`);
    }
}