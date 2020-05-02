export default (objA, objAVersion, objB, objBVersion) => {
    if (!objAVersion || objBVersion >= objAVersion) {
        return Object.assign({}, objA, objB);
    }
    return Object.assign({}, objB, objA);
};
