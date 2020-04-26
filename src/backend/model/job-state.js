let all;

class JobState {
    constructor(id, state, name, description, final, failure) {
        this.id = id;
        this.state = state;
        this.name = name;
        this.description = description;
        this.final = final === 1;
        this.failure = failure === 1;
    }

    static all() {
        return all;
    }

    static create(id, state, name, description, final, failure) {
        const newState = new JobState(id, state, name, description, final, failure);
        JobState[state.toUpperCase()] = newState;
        JobState[state] = newState;
        if (!all) {
            all = [];
        }
        all.push(newState);
        return newState;
    }

    static from(val) {
        return JobState[val];
    }

    getId() {
        return this.id;
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

module.exports = JobState;
