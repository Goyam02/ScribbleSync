export class SaveQueue {
    #lastSave;
    #saveFunction;

    constructor(saveFunction) {
        this.#lastSave = Promise.resolve();
        this.#saveFunction = saveFunction;
    }

    enqueue(data) {
        const nextSave = this.#lastSave.then(() => this.#saveFunction(data));

        this.#lastSave = nextSave.catch(() => {});

        return nextSave;
    }

    flush() {
        return this.#lastSave;
    }
}