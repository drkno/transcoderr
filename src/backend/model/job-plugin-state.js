class State {
    constructor(state) {
        this.state = state;
    }

    getState() {
        return this.state;
    }

    toString() {
        return this.getState();
    }
}

const States = {
    STARTED: new State('started'),
    SUCCESSFUL: new State('successful'),
    FAILED: new State('failed'),
    UNKNOWN: new State('unknown'),
    from: val => Object.values(States).filter(state => state.toString() === val)[0]
};

module.exports = States;
