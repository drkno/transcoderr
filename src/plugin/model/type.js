class Type {
    constructor(type) {
        this.type = type;
    }

    getType() {
        return this.type;
    }

    toJSON() {
        return this.type;
    }

    toString() {
        return this.type;
    }
}

const Types = {
    META: new Type('meta'),
    PRE: new Type('pre'),
    FILTER: new Type('filter'),
    EXEC: new Type('exec'),
    POST: new Type('post'),
    from: val => Object.values(Types).filter(type => type.toString() === val)[0]
};

module.exports = Types;
