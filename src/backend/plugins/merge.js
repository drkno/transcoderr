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
        ];
    }

    describe() {
        return {
            name: 'merge',
            description: 'merges ffmpeg options',
            version: '1.0.0',
            types: ['filter']
        };
    }

    _generateBuckets(buckets) {
        const bucketMap = {};
        for (let bucket of buckets) {
            const bucketItem = {
                collector: bucket,
                list: []
            };
            for (let bucketReference of bucket.patterns()) {
                bucketMap[bucketReference] = bucketItem;
            }
        }
        return bucketMap;
    }

    async filtermain(collector) {
        try {
            const buckets = this._generateBuckets(this._buckets);
            const options = collector.getFfmpegOptions();
            if (options.length === 0) {
                collector.vetoExec();
                return;
            }

            for (let option of options) {
                const firstOption = option[0];
                const bucket = buckets[firstOption] || buckets['*'];
                bucket.list.push(option);
            }

            collector.replaceAllFfmpegOptions([...new Set(Object.values(buckets))]
                .map(bucket => bucket.collector.merge(bucket.list))
                .flatMap(a => a));
        }
        catch(e) {
            LOG.error(e);
            throw e;
        }
    }
}

module.exports = new MergeFilterPlugin();
