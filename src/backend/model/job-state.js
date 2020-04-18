class State {
    constructor(state, final = false, failure = false) {
        this.state = state;
        this.final = final;
        this.failure = failure;
    }

    getState() {
        return this.state;
    }

    isFinalState() {
        return this.final;
    }

    isFailureState() {
        return this.failure;
    }

    toString() {
        return this.state;
    }
}

const States = {
    NEW: new State('new', true, false),
    META: new State('meta', false, false),
    PRE: new State('pre', false, false),
    FILTER: new State('filter', false, false),
    EXEC: new State('exec', false, false),
    POST: new State('post', false, false),
    COMPLETE: new State('complete', true, false),
    ABORT: new State('abort', true, true),
    from: val => Object.values(States).filter(state => state.toString() === val)[0]
};

module.exports = States;
