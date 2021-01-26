const { promisify } = require('util');
const { randomBytes } = require('crypto');
const { readdirSync, unlink } = require('fs');
const { join } = require('path');
const looksSameCallback = require('looks-same');
const ChildProcess = require('../../utils/spawn');

const looksSame = promisify(looksSameCallback);
const unlinkPromise = promisify(unlink);

class FakeDetectorPlugin {
    constructor() {
        const examplesDirectory = join(__dirname, 'examples');
        this._examples = readdirSync(examplesDirectory, 'utf-8')
            .map(file => join(examplesDirectory, file));
    }

    async premain(collector) {
        const { probe, file } = collector.getMetaData();
        const duration = probe.format.duration;
        const isFake = await this._isFake(file, duration);
        if (isFake) {
            LOG.info(`"${file}" looks like a fake, marking for deletion`);
            collector.setDelete();
        }
    }

    async _isFake(file, duration) {
        const halfDuration = this._toTime(duration / 2);
        return await this._withTempFile(async(tempFileLocation) => {
            await this._getScreenshot(halfDuration, file, tempFileLocation);
            const equals = await Promise.all(this._examples.map(file => looksSame(file, tempFileLocation)));
            return equals.some(equal => equal.equal);
        });
    }

    _toTime(duration) {
        const date = new Date(duration * 1000);
        return `${date.getUTCHours()}:${this._pad(date.getUTCMinutes())}:${this._pad(date.getSeconds())}`;
    }

    async _withTempFile(callback) {
        const tempFileName = randomBytes(20).toString('hex') + '.png';
        const tempFileLocation = join(process.env.temp || '/tmp', tempFileName);
        const result = await callback(tempFileLocation);
        try {
            await unlinkPromise(tempFileLocation);
        } catch(e) {
            LOG.warn(`Could not delete temporary file ${tempFileLocation}. Failed with error: ${e.stack}`);
        }
        return result;
    }

    async _getScreenshot(halfDuration, file, tempFileLocation) {
        const childProcess = new ChildProcess('ffmpeg',
            ['-hide_banner', '-ss', halfDuration, '-i', file, '-vframes', '1', '-filter:v', 'scale=670x340', '-q:v', '2', tempFileLocation]
        );
        return await childProcess.getStdErr();
    }
}

module.exports = FakeDetectorPlugin;
