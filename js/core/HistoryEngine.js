export class HistoryEngine{

    #actions;
    #cursor;
    #applyAction;
    #applyInverse;

    constructor({
        applyAction, applyInverse
    }){
        this.#actions = [];
        this.#cursor = 0;
        this.#applyAction = applyAction;
        this.#applyInverse = applyInverse;

    }
    *replay(fromIndex, toIndex){
            const step = fromIndex <= toIndex ? 1 : -1;
            for(let index = fromIndex; step === 1 ? index <= toIndex : index >=toIndex; index += step){
                yield this.#actions[index];
            }
    }
    record(action){
        this.#actions.splice(this.#cursor);
        this.#actions.push(action);
        this.#cursor++;
    }

    undo(){
        if(this.#cursor === 0) return false;

        const generator = this.replay(this.#cursor - 1, this.#cursor - 1);;

        const result = generator.next();

        const action = result.value;

        this.#applyInverse(action.inverse);

        this.#cursor--;
        return action.inverse;

    }

    redo(){
        if(this.#cursor >= this.#actions.length) return false;

        const generator = this.replay(this.#cursor, this.#cursor);

        const result = generator.next();
        const action = result.value;

        this.#applyAction(action);
        this.#cursor++;
        return action;

    }

    canUndo(){
        return this.#cursor > 0;
    }
    canRedo(){
        return this.#cursor < this.#actions.length;
    }

    clear(){
        this.#actions = [];
        this.#cursor = 0;
    }

}