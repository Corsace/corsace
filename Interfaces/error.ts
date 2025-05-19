export class HTTPError extends Error {
    public statusCode: number;
    public message: string;
    public cause?: unknown;

    constructor (statusCode: number, message: string, options?: ErrorOptions) {
        super(message);

        this.statusCode = statusCode;
        this.message = message;
        this.cause = options?.cause;
    }
}