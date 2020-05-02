class DirectoryService {
    constructor(preferencesService) {
        this._preferencesService = preferencesService;
    }

    getRealPath(path) {
        const regex = new RegExp(this._preferencesService.getMediaDirectoryRegex());
        return path.replace(regex, this._preferencesService.getMediaDirectory());
    }
}

module.exports = DirectoryService;
