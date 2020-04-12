class ScriptType {
    static META = Symbol('META');
    static EXEC = Symbol('EXEC');
    static POST = Symbol('POST');
    static PRE = Symbol('PRE');
    static FILTER = Symbol('FILTER');
}

module.exports = ScriptType;
