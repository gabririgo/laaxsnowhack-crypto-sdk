export class ConflictError extends Error {
    constructor(msg = "Cannot reset resource") {
        super();
        this.message = msg;
    }
}
