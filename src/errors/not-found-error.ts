export class NotFoundError extends Error {
    constructor(msg = "Resource not found for current user") {
        super();
        this.message = msg;
    }
}
