const ChildProcess = require('../utils/spawn');

class DimensionMetaScript {
    describe() {
        return {
            name: 'dimensions',
            description: 'adds actual and reported video dimensions to events',
            version: '1.0.0',
            type: ['meta']
        };
    }

    async metamain(collector) {
        let dim;
        try {
            const file = collector.getMetaDataItem('file');
            dim = await this._detectCrop(file);
            if (dim.x === 0 || dim.y === 0) {
                throw new Error('Could not detect dimensions');
            }
        } catch (e) {
            LOG.error(e);
            dim = {
                error: 'Could not detect dimensions',
                x: -1,
                y: -1,
                xOffeset: 0,
                yOffset: 0
            };
        }
        collector.appendMetaData('dimensions', dim);
    }

    _pad(num) {
        return num.toString().padStart(2, '0');
    }

    _toTime(duration) {
        const date = new Date(duration * 1000);
        return `${date.getUTCHours()}:${this._pad(date.getUTCMinutes())}:${this._pad(date.getSeconds())}`;
    }

    async _probe(file, fromTime) {
        const childProcess = new ChildProcess('ffmpeg',
            ['-hide_banner', '-ss', fromTime, '-i', file, '-to', '00:00:05', '-vf', 'cropdetect', '-    f', 'null', '-']
        );
        return await childProcess.getStdErr();
    }

    async _detectCrop(file) {
        const tenth = file.meta.Duration / 10;
        const probePoints = [
            tenth,
            tenth * 5,
            tenth * 9
        ];

        const cropDimensions = (await Promise.all(probePoints.map(point => this._probe(file, this._toTime(point)))))
            .map(output => output.split('\n')
                .map(line => line.trim())
                .filter(line => line.indexOf(' crop=') >= 0)
                .map(line => line.split(' ').slice(-1)[0])
                .map(line => line.split('=')[1])
                .map(line => line.split(':')))
            .reduce((acc, curr) => acc.concat(curr), [])
            .reduce((acc, curr) => {
                const [x, y, xOffset, yOffset] = curr;

                acc.x[x] = (acc.x[x] || 0) + 1;
                acc.x.mostCommon = acc.x[x] > acc.x.mostCommon ? x : acc.x.mostCommon;

                acc.y[y] = (acc.y[y] || 0) + 1;
                acc.y.mostCommon = acc.y[y] > acc.y.mostCommon ? y : acc.y.mostCommon;

                acc.xOffset[xOffset] = (acc.xOffset[xOffset] || 0) + 1;
                acc.xOffset.mostCommon = acc.xOffset[xOffset] > acc.xOffset.mostCommon ? xOffset : acc.xOffset.mostCommon;

                acc.yOffset[yOffset] = (acc.yOffset[yOffset] || 0) + 1;
                acc.yOffset.mostCommon = acc.yOffset[yOffset] > acc.yOffset.mostCommon ? yOffset : acc.yOffset.mostCommon;

                return acc;
            }, {
                x: {
                    mostCommon: 0
                },
                y: {
                    mostCommon: 0
                },
                xOffset: {
                    mostCommon: 0
                },
                yOffset: {
                    mostCommon: 0
                }
            });
        return {
            x: cropDimensions.x.mostCommon,
            y: cropDimensions.y.mostCommon,
            xOffeset: cropDimensions.xOffset.mostCommon,
            yOffset: cropDimensions.yOffset.mostCommon
        };
    }
}

module.exports = new DimensionMetaScript();
