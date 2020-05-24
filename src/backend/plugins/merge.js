class FilterBucket {
    patterns() {
        return ['-vf', '-filter:v'];
    }

    merge(options) {
        return ['-vf', options.map(option => option.slice(1))
            .flatMap(a => a)
            .join(',')];
    }
}

class CatchAllBucket {
    patterns() {
        return ['*'];
    }

    merge(options) {
        return options.flatMap(a => a);
    }
}

class MergeFilterPlugin {
    constructor() {
        this._buckets = [
            new FilterBucket(),
            new CatchAllBucket()
        ]
    }

    describe() {
        return {
            name: 'merge',
            description: 'merges ffmpeg options',
            version: '1.0.0',
            types: ['filter']
        };
    }

    async filtermain(collector) {
        const buckets = this._generateBuckets();
        const options = collector.getFfmpegOptions();
        for (let option of options) {
            option[0]
        }
    }

    _generateBuckets() {
        const buckets = {};
        for (let bucket of this._buckets) {
            const bucketList = [];
            for (let bucketReference of bucket) {
                buckets[bucketReference] = bucketList;
            }
        }
        return buckets;
    }

    _mergeVideoFilters() {

    }
}

module.exports = new MergeFilterPlugin();
